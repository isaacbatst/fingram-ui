import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBudgetSummary } from "@/hooks/useBudgetSummary";
import { useBudgets } from "@/hooks/useBudgets";
import { useBudgetStartDay } from "@/hooks/useBudgetStartDay";
import { useCategories, type Category } from "@/hooks/useCategories";
import { useState } from "react";
import { ErrorDisplay } from "./ErrorDisplay";
import { LoadingSpinner } from "./LoadingSpinner";
import { PencilIcon, CheckIcon, XIcon, SettingsIcon } from "lucide-react";
import { useSearchParams } from "@/hooks/useSearchParams";
import { ScrollArea } from "./ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { getCurrentBudgetPeriod } from "@/lib/utils";
const months = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

// Gerar anos (ano atual - 2 até ano atual + 1)
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 4 }, (_, i) => currentYear - 2 + i);


// Generate days 1-28 for budget start day selection
const days = Array.from({ length: 28 }, (_, i) => i + 1);

// Helper function to calculate budget period dates
function getBudgetPeriodLabel(
  month: number,
  year: number,
  startDay: number
): string {
  const startDate = new Date(year, month - 1, startDay);
  const endDate = new Date(year, month, startDay - 1);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

export function OrcamentoTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { setBudgets } = useBudgets();
  const { data: categories } = useCategories();
  const {
    budgetStartDay,
    setBudgetStartDay,
    isLoading: isLoadingStartDay,
  } = useBudgetStartDay();

  const defaultPeriod = getCurrentBudgetPeriod(budgetStartDay);
  const selectedYear = parseInt(
    searchParams.get("orcamento_ano") || defaultPeriod.year.toString(),
    10
  );
  const setSelectedYear = (year: number) => {
    setSearchParams({ orcamento_ano: year.toString() });
  };
  const selectedMonth = parseInt(
    searchParams.get("orcamento_mes") || defaultPeriod.month.toString(),
    10
  );
  const setSelectedMonth = (month: number) => {
    setSearchParams({ orcamento_mes: month.toString() });
  };

  const [isEditing, setIsEditing] = useState(false);
  const [editingBudgets, setEditingBudgets] = useState<Record<string, string>>(
    {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pendingStartDay, setPendingStartDay] = useState<number | null>(null);

  // Handle start day change
  const handleStartDayChange = async (value: string) => {
    const day = parseInt(value, 10);
    setPendingStartDay(day);
    const result = await setBudgetStartDay(day);
    if (result.success) {
      setIsSettingsOpen(false);
      // Refresh budget data
      mutate();
    }
    setPendingStartDay(null);
  };

  const {
    data: budgetData,
    isLoading,
    error,
    mutate,
  } = useBudgetSummary(selectedYear, selectedMonth);

  const orcamento =
    budgetData?.budget?.map((b) => ({
      categoria: b.category.name,
      categoryId: b.category.id,
      valor: b.amount,
      usado: b.spent,
    })) ?? [];

  // Calcular totais do orçamento
  const totalOrcamento = orcamento.reduce((sum, item) => sum + item.valor, 0);
  const totalGasto = orcamento.reduce((sum, item) => sum + item.usado, 0);
  const saldoRestante = totalOrcamento - totalGasto;
  const percentualUso = totalOrcamento > 0 ? (totalGasto / totalOrcamento) * 100 : 0;

  const handleEditClick = () => {
    setIsEditing(true);
    // Inicializar os valores dos inputs com os valores atuais
    const initialValues: Record<string, string> = {};
    orcamento.forEach((item) => {
      initialValues[item.categoryId] = item.valor.toString();
    });
    
    // Adicionar categorias que não têm orçamento definido
    categories?.forEach((cat: Category) => {
      if (!initialValues[cat.id]) {
        initialValues[cat.id] = "0";
      }
    });
    
    setEditingBudgets(initialValues);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingBudgets({});
  };

  const handleSaveBudgets = async () => {
    setIsSaving(true);
    try {
      const budgetsToSave = Object.entries(editingBudgets)
        .map(([categoryId, amountStr]) => ({
          categoryId,
          amount: parseFloat(amountStr) || 0,
        }))
        .filter((budget) => budget.amount > 0); // Só enviar orçamentos > 0

      const result = await setBudgets(budgetsToSave);
      if (result.success) {
        setIsEditing(false);
        setEditingBudgets({});
        // Atualizar os dados
        mutate();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleBudgetChange = (categoryId: string, value: string) => {
    // Permitir apenas números e pontos decimais
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setEditingBudgets((prev) => ({
        ...prev,
        [categoryId]: value,
      }));
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="mb-4">
        <div className="mb-3 font-semibold text-foreground text-base flex justify-between items-center font-display tracking-tight">
          <span>Orçamento por categoria</span>
          <div className="flex gap-1">
            {!isEditing && (
              <>
                <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Configurações do orçamento"
                    >
                      <SettingsIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="end">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="budget-start-day">
                          Dia de início do período
                        </Label>
                        <Select
                          value={
                            pendingStartDay?.toString() ??
                            budgetStartDay.toString()
                          }
                          onValueChange={handleStartDayChange}
                          disabled={isLoadingStartDay || pendingStartDay !== null}
                        >
                          <SelectTrigger id="budget-start-day">
                            <SelectValue placeholder="Selecione o dia" />
                          </SelectTrigger>
                          <SelectContent>
                            {days.map((day) => (
                              <SelectItem key={day} value={day.toString()}>
                                Dia {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          O orçamento será calculado do dia {budgetStartDay} de
                          cada mês até o dia {budgetStartDay - 1 || 28} do mês
                          seguinte.
                        </p>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditClick}
                  className="h-8 w-8 p-0"
                  title="Editar orçamentos"
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
              </>
            )}
            {isEditing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveBudgets}
                  disabled={isSaving}
                  className="h-8 w-8 p-0"
                  title="Salvar orçamentos"
                >
                  <CheckIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="h-8 w-8 p-0"
                  title="Cancelar edição"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Seletores de ano e mês */}
        <div className="flex gap-2">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(value) => setSelectedMonth(parseInt(value, 10))}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value, 10))}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Period display - only show if budgetStartDay is not 1 */}
        {budgetStartDay !== 1 && (
          <div className="mt-2 text-xs text-muted-foreground text-center">
            Período:{" "}
            {getBudgetPeriodLabel(selectedMonth, selectedYear, budgetStartDay)}
          </div>
        )}
      </div>

      {/* Resumo do Orçamento */}
      {orcamento.length > 0 && (
        <div className="border border-border rounded-lg p-3 mb-3 duna-card duna-surface">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Orçamento</div>
              <div className="text-sm font-bold text-foreground font-mono">
                R$ {totalOrcamento.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Gasto</div>
              <div className="text-sm font-bold text-foreground font-mono">
                R$ {totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Disponível</div>
              <div className={`text-sm font-bold font-mono ${saldoRestante >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
                R$ {saldoRestante.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-full h-2" style={{ backgroundColor: 'var(--color-border)' }}>
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  percentualUso > 90 ? 'bg-[var(--color-danger)]' :
                  percentualUso > 70 ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-success)]'
                }`}
                style={{ width: `${Math.min(100, percentualUso)}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono shrink-0">
              {percentualUso.toFixed(0)}%
            </span>
          </div>
        </div>
      )}

      {!budgetData && !error && isLoading && (
        <div className="text-center py-2">
          <LoadingSpinner />
        </div>
      )}

      {/* Error */}
      {error && (
        <ErrorDisplay error={error.message} onRetry={mutate} className="my-4" />
      )}

      {/* Conteúdo do orçamento */}
      <ScrollArea className="space-y-4 flex flex-col flex-1 pr-3 overflow-y-auto">
          {isEditing ? (
            // Modo de edição - mostrar todas as categorias
            <>
              {categories?.map((category: Category) => {
                const currentBudget = orcamento.find(
                  (o) => o.categoryId === category.id
                );
                const budgetValue = editingBudgets[category.id] || "0";

                return (
                  <div key={category.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-foreground text-sm">
                        {category.name}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        Usado: R$ {currentBudget?.usado.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">R$</span>
                      <Input
                        type="text"
                        value={budgetValue}
                        onChange={(e) =>
                          handleBudgetChange(category.id, e.target.value)
                        }
                        placeholder="0.00"
                        className="flex-1"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                );
              })}
              {isSaving && (
                <div className="text-center py-2">
                  <LoadingSpinner />
                </div>
              )}
            </>
          ) : (
            // Modo de visualização - mostrar apenas categorias com orçamento
            <>
              {orcamento.length > 0 ? (
                orcamento.map((c) => {
                  const pct = Math.min(100, (c.usado / c.valor) * 100);
                  const filledColor = pct > 90 ? "var(--color-danger)" : pct > 70 ? "var(--color-warning)" : "var(--color-success)";
                  const bgColor = "var(--color-border)";

                  return (
                    <div key={c.categoria} className="mb-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {c.categoria}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {c.usado.toFixed(0)} / {c.valor.toFixed(0)}
                        </span>
                      </div>
                      <Progress
                        value={pct}
                        filledColor={filledColor}
                        bgColor={bgColor}
                        className="h-1.5"
                      />
                    </div>
                  );
                })
              ) : !isLoading && (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-5">
                    <PencilIcon className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2 tracking-tight">
                    Nenhum orçamento definido
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                    Clique no ícone de edição para definir orçamentos para este período.
                  </p>
                </div>
              )}
            </>
          )}
        </ScrollArea>
    </div>
  );
}

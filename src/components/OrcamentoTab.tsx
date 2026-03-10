import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MoneyInput } from "@/components/MoneyInput";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { RingChart } from "@/components/RingChart";
import { useBudgetSummary } from "@/hooks/useBudgetSummary";
import { useBudgets } from "@/hooks/useBudgets";
import { useBudgetStartDay } from "@/hooks/useBudgetStartDay";
import { useCategories, type Category } from "@/hooks/useCategories";
import { useState } from "react";
import { ErrorDisplay } from "./ErrorDisplay";
import { LoadingSpinner } from "./LoadingSpinner";
import { PencilIcon, ChevronLeftIcon, ChevronRightIcon, SettingsIcon } from "lucide-react";
import { useSearchParams } from "@/hooks/useSearchParams";
import { ScrollArea } from "./ui/scroll-area";
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

// Generate days 1-28 for budget start day selection
const days = Array.from({ length: 28 }, (_, i) => i + 1);

function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
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
    10,
  );
  const setSelectedYear = (year: number) => {
    setSearchParams({ orcamento_ano: year.toString() });
  };
  const selectedMonth = parseInt(
    searchParams.get("orcamento_mes") || defaultPeriod.month.toString(),
    10,
  );
  const setSelectedMonth = (month: number) => {
    setSearchParams({ orcamento_mes: month.toString() });
  };

  // Edit drawer state
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState("");
  const [editBudgetValue, setEditBudgetValue] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Settings drawer state
  const [settingsDrawerOpen, setSettingsDrawerOpen] = useState(false);
  const [pendingStartDay, setPendingStartDay] = useState<number | null>(null);

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
  const percentualUso =
    totalOrcamento > 0 ? (totalGasto / totalOrcamento) * 100 : 0;

  // Categories with budget vs without
  const categoriesWithBudget = orcamento;
  const categoriesWithoutBudget =
    categories?.filter(
      (cat: Category) => !orcamento.find((o) => o.categoryId === cat.id),
    ) ?? [];

  // Month navigation
  const goToPrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const monthLabel =
    months.find((m) => m.value === selectedMonth)?.label ?? "";

  // Open edit drawer for a category
  const handleOpenEdit = (categoryId: string, categoryName: string) => {
    const existing = orcamento.find((o) => o.categoryId === categoryId);
    setEditCategoryId(categoryId);
    setEditCategoryName(categoryName);
    setEditBudgetValue(existing?.valor ?? 0);
    setEditDrawerOpen(true);
  };

  // Save single category budget via drawer
  const handleSaveBudget = async () => {
    if (!editCategoryId) return;
    setIsSaving(true);
    try {
      const allBudgets = orcamento.map((item) => ({
        categoryId: item.categoryId,
        amount: item.categoryId === editCategoryId ? editBudgetValue : item.valor,
      }));
      // Add if new category
      if (!allBudgets.find((b) => b.categoryId === editCategoryId)) {
        allBudgets.push({ categoryId: editCategoryId, amount: editBudgetValue });
      }
      const result = await setBudgets(
        allBudgets.filter((b) => b.amount > 0),
      );
      if (result.success) {
        setEditDrawerOpen(false);
        setEditCategoryId(null);
        mutate();
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handle start day change
  const handleStartDayChange = async (value: string) => {
    const day = parseInt(value, 10);
    setPendingStartDay(day);
    const result = await setBudgetStartDay(day);
    if (result.success) {
      setSettingsDrawerOpen(false);
      mutate();
    }
    setPendingStartDay(null);
  };

  const hasBudgets = orcamento.length > 0;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Month heading with arrow nav */}
      <div className="flex items-center justify-center gap-2 mb-5">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevMonth}
          className="h-11 w-11"
          aria-label="Mês anterior"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Button>
        <h2 className="font-display text-2xl text-foreground tracking-tight">
          {monthLabel} {selectedYear}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          className="h-11 w-11"
          aria-label="Próximo mês"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSettingsDrawerOpen(true)}
          className="h-11 w-11"
          aria-label="Configurações do orçamento"
        >
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Loading */}
      {!budgetData && !error && isLoading && (
        <div className="text-center py-2">
          <LoadingSpinner />
        </div>
      )}

      {/* Error */}
      {error && (
        <ErrorDisplay error={error.message} onRetry={mutate} className="my-4" />
      )}

      {/* Main content */}
      {budgetData && !error && (
        <ScrollArea className="flex flex-col flex-1 pr-3 overflow-y-auto">
          {hasBudgets ? (
            <>
              {/* Ring chart */}
              <div className="flex flex-col items-center mb-6">
                <RingChart
                  value={percentualUso}
                  size={140}
                  strokeWidth={12}
                  label="gasto"
                />
                <div className="mt-3 text-center">
                  <div className="text-base font-mono font-bold text-foreground">
                    {formatMoney(totalGasto)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    de {formatMoney(totalOrcamento)}
                  </div>
                  <div
                    className={`text-sm font-mono mt-1 ${
                      saldoRestante >= 0
                        ? "text-[var(--color-success)]"
                        : "text-[var(--color-danger)]"
                    }`}
                  >
                    {saldoRestante >= 0
                      ? `${formatMoney(saldoRestante)} disponível`
                      : `${formatMoney(Math.abs(saldoRestante))} acima`}
                  </div>
                </div>
              </div>

              {/* Category list */}
              <div className="space-y-3">
                {categoriesWithBudget.map((c) => {
                  const pct = c.valor > 0 ? Math.min(100, (c.usado / c.valor) * 100) : 0;
                  const filledColor =
                    pct > 90
                      ? "var(--color-danger)"
                      : pct > 70
                        ? "var(--color-warning)"
                        : "var(--color-success)";

                  return (
                    <button
                      key={c.categoryId}
                      type="button"
                      className="w-full text-left rounded-xl border border-border p-3 duna-card duna-surface transition-colors active:bg-muted/50"
                      onClick={() => handleOpenEdit(c.categoryId, c.categoria)}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-base text-foreground tracking-tight">
                          {c.categoria}
                        </span>
                        <span className="text-sm text-muted-foreground font-mono">
                          {formatMoney(c.usado)}
                        </span>
                      </div>
                      <Progress
                        value={pct}
                        filledColor={filledColor}
                        bgColor="var(--color-border)"
                        className="h-2.5"
                      />
                      <div className="mt-1 text-xs text-muted-foreground font-mono">
                        de {formatMoney(c.valor)}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Categories without budget */}
              {categoriesWithoutBudget.length > 0 && (
                <div className="mt-6">
                  <div className="border-t border-border mb-3" />
                  <p className="text-xs text-muted-foreground mb-2">
                    Sem orçamento definido:
                  </p>
                  <div className="space-y-1">
                    {categoriesWithoutBudget.map((cat: Category) => (
                      <button
                        key={cat.id}
                        type="button"
                        className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors active:bg-muted/50"
                        onClick={() => handleOpenEdit(cat.id, cat.name)}
                      >
                        <span className="font-display text-sm text-muted-foreground tracking-tight">
                          {cat.name}
                        </span>
                        <PencilIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            !isLoading && (
              <>
                {/* Empty state */}
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-5">
                    <PencilIcon className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2 tracking-tight">
                    Nenhum orçamento definido
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
                    Toque em uma categoria para definir
                  </p>
                </div>

                {/* Show all categories as tappable items */}
                {categories && categories.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {categories.map((cat: Category) => (
                      <button
                        key={cat.id}
                        type="button"
                        className="w-full flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors active:bg-muted/50"
                        onClick={() => handleOpenEdit(cat.id, cat.name)}
                      >
                        <span className="font-display text-sm text-foreground tracking-tight">
                          {cat.name}
                        </span>
                        <PencilIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )
          )}
        </ScrollArea>
      )}

      {/* Edit Drawer (per-category) */}
      <Drawer
        open={editDrawerOpen}
        onOpenChange={(open) => {
          setEditDrawerOpen(open);
          if (!open) {
            setEditCategoryId(null);
          }
        }}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="font-display text-xl tracking-tight">
              {editCategoryName}
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Editar orçamento da categoria
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-budget-amount">Orçamento mensal</Label>
              <MoneyInput
                id="edit-budget-amount"
                value={editBudgetValue}
                onChange={setEditBudgetValue}
                disabled={isSaving}
                autoFocus
              />
            </div>
          </div>

          <DrawerFooter>
            <div className="flex gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setEditDrawerOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveBudget}
                disabled={isSaving}
              >
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Settings Drawer */}
      <Drawer
        open={settingsDrawerOpen}
        onOpenChange={setSettingsDrawerOpen}
      >
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="font-display text-xl tracking-tight">
              Configurações
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              Configurações do orçamento
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="settings-start-day">
                Dia de início do período
              </Label>
              <Select
                value={
                  pendingStartDay?.toString() ?? budgetStartDay.toString()
                }
                onValueChange={handleStartDayChange}
                disabled={isLoadingStartDay || pendingStartDay !== null}
              >
                <SelectTrigger id="settings-start-day">
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
                O orçamento será calculado do dia {budgetStartDay} de cada mês
                até o dia {budgetStartDay - 1 || 28} do mês seguinte.
              </p>
            </div>
          </div>

          <DrawerFooter>
            <Button
              variant="outline"
              onClick={() => setSettingsDrawerOpen(false)}
            >
              Fechar
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

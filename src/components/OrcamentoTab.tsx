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
import { useCategories, type Category } from "@/hooks/useCategories";
import { useState } from "react";
import { ErrorDisplay } from "./ErrorDisplay";
import { LoadingSpinner } from "./LoadingSpinner";
import { PencilIcon, CheckIcon, XIcon } from "lucide-react";
import { useSearchParams } from "@/hooks/useSearchParams";
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

export function OrcamentoTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { setBudgets } = useBudgets();
  const { data: categories } = useCategories();
  const selectedYear = parseInt(searchParams.get("orcamento_ano") || currentYear.toString(), 10);
  const setSelectedYear = (year: number) => {
    setSearchParams({ orcamento_ano: year.toString() });
  }
  const selectedMonth = parseInt(searchParams.get("orcamento_mes") || (new Date().getMonth() + 1).toString(), 10);
  const setSelectedMonth = (month: number) => {
    setSearchParams({ orcamento_mes: month.toString() });
  }

  const [isEditing, setIsEditing] = useState(false);
  const [editingBudgets, setEditingBudgets] = useState<
    Record<string, string>
  >({});
  const [isSaving, setIsSaving] = useState(false);

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
    <div>
      <div className="mb-4">
        <div className="mb-3 font-semibold text-gray-700 text-base flex justify-between items-center">
          <span>Orçamento por categoria</span>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditClick}
              className="h-8 w-8 p-0"
              title="Editar orçamentos"
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-1">
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
            </div>
          )}
        </div>

        {/* Seletores de ano e mês */}
        <div className="flex gap-2 mb-4">
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
      </div>

      {/* Resumo do Orçamento */}
      {orcamento.length > 0 && (
        <div className="bg-gradient-to-r  border border-gray-200 rounded-lg p-4 mb-6">
          <div className="text-center">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-500 mb-1">Orçamento Total</div>
                <div className="text-lg font-bold text-gray-900">
                  R$ {totalOrcamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Total Gasto</div>
                <div className="text-lg font-bold text-gray-900">
                  R$ {totalGasto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Orçamento Dísponivel</span>
                <span className={`text-sm font-medium ${saldoRestante >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {saldoRestante.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className={`h-4 rounded-full transition-all duration-300 ${
                    percentualUso > 90 ? 'bg-red-500' : 
                    percentualUso > 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(100, percentualUso)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {percentualUso.toFixed(1)}% do orçamento utilizado
              </div>
            </div>
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
      <div className="space-y-4">
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
                      <span className="font-medium text-gray-600 text-sm">
                        {category.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        Usado: R$ {currentBudget?.usado.toFixed(2) || "0.00"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">R$</span>
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

                  // Cores para a barra de progresso
                  const filledColor = pct > 90 ? "#ef4444" : "#00c950"; // red-500 : green-500
                  const bgColor = "#e5e7eb"; // gray-200

                  return (
                    <div key={c.categoria}>
                      <div className="flex justify-between mb-1">
                        <span className="font-medium text-gray-600">
                          {c.categoria}
                        </span>
                        <span className="text-xs text-gray-400">
                          R$ {c.usado.toFixed(2)}/{c.valor.toFixed(2)}
                        </span>
                      </div>
                      <Progress
                        value={pct}
                        filledColor={filledColor}
                        bgColor={bgColor}
                        className="h-4"
                      />
                    </div>
                  );
                })
              ) : !isLoading && (
                <div className="text-center p-6 text-gray-500">
                  <p className="text-sm">
                    Nenhum orçamento definido para este período
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Clique no ícone de edição para definir orçamentos
                  </p>
                </div>
              )}
            </>
          )}
        </div>
    </div>
  );
}

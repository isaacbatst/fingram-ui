import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBudgetSummary } from "@/hooks/useBudgetSummary";
import { useTheme } from "@/hooks/useTheme";
import { useState } from "react";
import { ErrorDisplay } from "./ErrorDisplay";
import { LoadingSpinner } from "./LoadingSpinner";

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
  const { getThemeColor } = useTheme();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  
  const { data: budgetData, isLoading, error, mutate } = useBudgetSummary(selectedYear, selectedMonth);

  const orcamento = budgetData?.budget?.map((b) => ({
    categoria: b.category.name,
    valor: b.amount,
    usado: b.spent,
  })) ?? [];

  return (
    <div>
      <div className="mb-4">
        <div className="mb-3 font-semibold text-gray-700 text-base">
          Orçamento por categoria
        </div>
        
        {/* Seletores de ano e mês */}
        <div className="flex gap-2 mb-4">
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
        </div>
      </div>

      {/* Loading */}
      {isLoading && <LoadingSpinner />}

      {/* Error */}
      {error && (
        <ErrorDisplay
          error={error.message}
          onRetry={mutate}
          className="my-4"
        />
      )}

      {/* Conteúdo do orçamento */}
      {!isLoading && !error && orcamento.length > 0 && (
        <div className="space-y-4">
          {orcamento.map((c) => {
            const pct = Math.min(100, (c.usado / c.valor) * 100);
            
            // Cores para a barra de progresso
            const filledColor = pct > 90
              ? getThemeColor("destructive_text_color")
              : getThemeColor("accent_text_color");
            
            const bgColor = getThemeColor("section_separator_color");
            
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
          })}
        </div>
      )}

      {/* Estado vazio */}
      {!isLoading && !error && orcamento.length === 0 && (
        <div className="text-center p-6 text-gray-500">
          <p className="text-sm">Nenhum orçamento encontrado para este período</p>
        </div>
      )}
    </div>
  );
}

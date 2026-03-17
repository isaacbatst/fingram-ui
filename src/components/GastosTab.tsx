import { useSearchParams } from "@/hooks/useSearchParams";
import { useBudgetStartDay } from "@/hooks/useBudgetStartDay";
import { getCurrentBudgetPeriod } from "@/lib/utils";
import { GastosOverview } from "./GastosOverview";
import { GastosTransacoes } from "./GastosTransacoes";

type Level = "overview" | "transacoes";

function getLevel(searchParams: URLSearchParams): Level {
  if (searchParams.get("gastos_categoria")) return "transacoes";
  if (searchParams.get("gastos_busca") === "1") return "transacoes";
  return "overview";
}

export function GastosTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { budgetStartDay } = useBudgetStartDay();
  const defaultPeriod = getCurrentBudgetPeriod(budgetStartDay);

  const level = getLevel(searchParams);

  // Shared month/year from URL
  const selectedYear = parseInt(
    searchParams.get("gastos_ano") || defaultPeriod.year.toString(),
    10,
  );
  const selectedMonth = parseInt(
    searchParams.get("gastos_mes") || defaultPeriod.month.toString(),
    10,
  );

  const setSelectedPeriod = (month: number, year: number) => {
    setSearchParams({
      gastos_mes: month.toString(),
      gastos_ano: year.toString(),
      gastos_pagina: "",
    });
  };

  // Navigation actions (per spec param mutation table)
  const drillToCategory = (categoryId: string) => {
    setSearchParams({
      gastos_categoria: categoryId,
      gastos_busca: "",
      gastos_descricao: "",
      gastos_estrato: "",
      gastos_pagina: "",
    });
  };

  const openFreeSearch = () => {
    setSearchParams({
      gastos_busca: "1",
      gastos_categoria: "",
      gastos_pagina: "",
    });
  };

  const goBackToOverview = () => {
    setSearchParams({
      gastos_categoria: "",
      gastos_busca: "",
      gastos_descricao: "",
      gastos_estrato: "",
      gastos_pagina: "",
    });
  };

  if (level === "transacoes") {
    return (
      <GastosTransacoes
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        setSelectedPeriod={setSelectedPeriod}
        onBack={goBackToOverview}
      />
    );
  }

  return (
    <GastosOverview
      selectedYear={selectedYear}
      selectedMonth={selectedMonth}
      setSelectedPeriod={setSelectedPeriod}
      onDrillCategory={drillToCategory}
      onOpenSearch={openFreeSearch}
    />
  );
}

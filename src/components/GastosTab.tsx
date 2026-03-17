import { useState, useEffect, useRef } from "react";
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

  // --- Slide transition state ---
  const [displayLevel, setDisplayLevel] = useState<Level>(level);
  const [transitioning, setTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");
  const prevLevelRef = useRef<Level>(level);

  useEffect(() => {
    const prevLevel = prevLevelRef.current;
    if (level !== prevLevel) {
      setSlideDirection(level === "transacoes" ? "left" : "right");
      setTransitioning(true);

      const timer = setTimeout(() => {
        setTransitioning(false);
        setDisplayLevel(level);
      }, 350);

      prevLevelRef.current = level;
      return () => clearTimeout(timer);
    }
  }, [level]);

  // During transition, both panels are mounted. Otherwise, only the active one.
  const showOverview = level === "overview" || displayLevel === "overview" || transitioning;
  const showTransacoes = level === "transacoes" || displayLevel === "transacoes" || transitioning;

  // Compute slide positions
  const isForward = slideDirection === "left"; // overview → transacoes
  const overviewTransform = transitioning
    ? isForward
      ? "translateX(-100%)"  // sliding out to the left
      : "translateX(0)"     // sliding back in from the left
    : level === "overview"
      ? "translateX(0)"
      : "translateX(-100%)";

  const transacoesTransform = transitioning
    ? isForward
      ? "translateX(0)"      // sliding in from the right
      : "translateX(100%)"   // sliding out to the right
    : level === "transacoes"
      ? "translateX(0)"
      : "translateX(100%)";

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden relative">
      {showOverview && (
        <div
          className="absolute inset-0 flex flex-col overflow-y-auto"
          style={{
            transform: overviewTransform,
            transition: transitioning ? "transform 350ms var(--ease-out)" : "none",
            pointerEvents: level === "overview" && !transitioning ? "auto" : "none",
          }}
          aria-hidden={level !== "overview"}
        >
          <GastosOverview
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            setSelectedPeriod={setSelectedPeriod}
            onDrillCategory={drillToCategory}
            onOpenSearch={openFreeSearch}
          />
        </div>
      )}
      {showTransacoes && (
        <div
          className="absolute inset-0 flex flex-col overflow-y-auto"
          style={{
            transform: transacoesTransform,
            transition: transitioning ? "transform 350ms var(--ease-out)" : "none",
            pointerEvents: level === "transacoes" && !transitioning ? "auto" : "none",
          }}
          aria-hidden={level !== "transacoes"}
        >
          <GastosTransacoes
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            setSelectedPeriod={setSelectedPeriod}
            onBack={goBackToOverview}
          />
        </div>
      )}
    </div>
  );
}

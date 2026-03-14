import { useState, useMemo, useDeferredValue } from "react";
import { usePlans } from "@/hooks/usePlans";
import { usePlan } from "@/hooks/usePlan";
import { useProjection } from "@/hooks/useProjection";
import { computeKpis, computeMilestones, computeCashStats } from "@/utils/plan-dashboard";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { PlanHeader } from "./PlanHeader";
import { KpiRow } from "./KpiRow";
import { ProjectionChart } from "./ProjectionChart";
import { AllocationList } from "./AllocationList";
import { CashSection } from "./CashSection";
import { MonthBreakdown } from "./MonthBreakdown";
import { MonthNavigator } from "./MonthNavigator";

export function PlanDashboard() {
  const { plans, error: plansError, isLoading: plansLoading } = usePlans();

  // Pick the first active plan (or first plan if none active)
  const activePlan = plans?.find((p) => p.status === "active") ?? plans?.[0] ?? null;
  const planId = activePlan?.id ?? null;

  const { plan, error: planError, isLoading: planLoading } = usePlan(planId);
  const { projection, error: projError, isLoading: projLoading } = useProjection(planId);

  const isLoading = plansLoading || planLoading || projLoading;
  const error = plansError || planError || projError;

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const deferredMonthIndex = useDeferredValue(selectedMonthIndex);

  const kpis = useMemo(
    () => (projection && plan ? computeKpis(projection, plan.boxes, deferredMonthIndex) : null),
    [projection, plan, deferredMonthIndex],
  );
  const milestones = useMemo(
    () => (projection && plan ? computeMilestones(projection, plan.boxes) : null),
    [projection, plan],
  );
  const cashStats = useMemo(
    () => (projection ? computeCashStats(projection, deferredMonthIndex) : null),
    [projection, deferredMonthIndex],
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorDisplay
        error={error.message ?? "Erro ao carregar plano"}
        onRetry={() => window.location.reload()}
        className="my-8"
      />
    );
  }

  if (!plan || !projection || projection.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
        <h2 className="font-display text-xl font-semibold text-foreground mb-3 tracking-tight">
          Nenhum plano encontrado
        </h2>
        <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
          Crie um plano pelo bot do Telegram para visualizar sua projeção aqui.
        </p>
      </div>
    );
  }

  const selectedMonth = projection[deferredMonthIndex];

  return (
    <div className="pb-6">
      <PlanHeader plan={plan} totalMonths={projection.length} />
      <MonthNavigator
        projection={projection}
        selectedIndex={selectedMonthIndex}
        onChange={setSelectedMonthIndex}
      />
      {kpis && <KpiRow kpis={kpis} />}
      <MonthBreakdown monthData={selectedMonth} boxes={plan.boxes} />
      <ProjectionChart
        projection={projection}
        boxes={plan.boxes}
        milestones={milestones ?? []}
        selectedMonthIndex={deferredMonthIndex}
        onMonthSelect={setSelectedMonthIndex}
      />
      {plan.boxes.length > 0 && (
        <AllocationList
          boxes={plan.boxes}
          lastMonth={selectedMonth}
          milestones={milestones ?? []}
          projection={projection}
        />
      )}
      {cashStats && (
        <CashSection
          projection={projection}
          stats={cashStats}
          selectedMonthIndex={deferredMonthIndex}
        />
      )}
    </div>
  );
}

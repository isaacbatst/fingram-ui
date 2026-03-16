import { useState, useMemo, useCallback, useDeferredValue, useEffect } from "react";
import { usePlans } from "@/hooks/usePlans";
import { usePlan } from "@/hooks/usePlan";
import { useProjection } from "@/hooks/useProjection";
import { useBoxes } from "@/hooks/useBoxes";
import { useSearchParams } from "@/hooks/useSearchParams";
import { computeMilestones, computePatrimonio, computeComprometido } from "@/utils/plan-dashboard";
import { getBoxColor } from "@/utils/box-colors";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { PlanHeader } from "./PlanHeader";
import { PatrimonioSection } from "./PatrimonioSection";
import { ProjectionChart } from "./ProjectionChart";
import { AllocationDetailDrawer } from "./AllocationDetailDrawer";
import { MonthBreakdown } from "./MonthBreakdown";
import { MonthNavigator } from "./MonthNavigator";

function computeTodayIndex(projection: { isReal: boolean }[]): number {
  const idx = projection.findIndex(m => !m.isReal);
  return idx === -1 ? projection.length - 1 : idx;
}

export function PlanDashboard() {
  const { plans, error: plansError, isLoading: plansLoading } = usePlans();

  // Pick the first active plan (or first plan if none active)
  const activePlan = plans?.find((p) => p.status === "active") ?? plans?.[0] ?? null;
  const planId = activePlan?.id ?? null;

  const { plan, error: planError, isLoading: planLoading } = usePlan(planId);
  const { projection, error: projError, isLoading: projLoading } = useProjection(planId);
  const { boxes } = useBoxes();
  const savingBoxes = useMemo(() => (boxes ?? []).filter((b) => b.type === 'saving'), [boxes]);

  const isLoading = plansLoading || planLoading || projLoading;
  const error = plansError || planError || projError;

  // Today index — first projected month (or last month if all real)
  const todayIndex = useMemo(
    () => projection ? computeTodayIndex(projection) : 0,
    [projection],
  );

  // Month selection synced with ?mes query param
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedMonthIndex, setSelectedMonthIndexRaw] = useState<number | null>(null);

  // Initialize from query param or todayIndex once projection loads
  useEffect(() => {
    if (!projection || projection.length === 0) return;
    const mesParam = searchParams.get("mes");
    if (mesParam !== null) {
      const parsed = parseInt(mesParam, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < projection.length) {
        setSelectedMonthIndexRaw(parsed);
        return;
      }
    }
    // Invalid or absent — use todayIndex
    setSelectedMonthIndexRaw(todayIndex);
    setSearchParams({ mes: String(todayIndex) }, { replace: true });
  }, [projection, todayIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const setSelectedMonthIndex = useCallback((index: number) => {
    setSelectedMonthIndexRaw(index);
    setSearchParams({ mes: String(index) }, { replace: true });
  }, [setSearchParams]);

  const resolvedMonthIndex = selectedMonthIndex ?? todayIndex;
  const deferredMonthIndex = useDeferredValue(resolvedMonthIndex);

  // Drawer state
  const [selectedAllocationId, setSelectedAllocationId] = useState<string | null>(null);
  const selectedAllocation = selectedAllocationId && plan
    ? plan.allocations.find((a) => a.id === selectedAllocationId) ?? null
    : null;

  const handleAllocationClick = useCallback((allocationId: string) => {
    setSelectedAllocationId(allocationId);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setSelectedAllocationId(null);
  }, []);

  const getColor = useCallback(
    (allocationId: string) => plan ? getBoxColor(plan.allocations, allocationId) : 'var(--color-data-1)',
    [plan],
  );
  const patrimonioData = useMemo(
    () => (projection && plan ? computePatrimonio(projection, plan.allocations, deferredMonthIndex, getColor) : null),
    [projection, plan, deferredMonthIndex, getColor],
  );
  const comprometidoData = useMemo(
    () => (projection && plan ? computeComprometido(projection, plan.allocations, deferredMonthIndex, getColor) : null),
    [projection, plan, deferredMonthIndex, getColor],
  );
  const milestones = useMemo(
    () => (projection && plan ? computeMilestones(projection, plan.allocations) : null),
    [projection, plan],
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <ErrorDisplay
        error="Erro ao carregar plano"
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
        selectedIndex={resolvedMonthIndex}
        todayIndex={todayIndex}
        onChange={setSelectedMonthIndex}
      />
      <MonthBreakdown monthData={selectedMonth} allocations={plan.allocations} />
      {patrimonioData && comprometidoData && (
        <PatrimonioSection
          patrimonio={patrimonioData}
          comprometido={comprometidoData}
          onAllocationClick={handleAllocationClick}
        />
      )}
      <ProjectionChart
        projection={projection}
        allocations={plan.allocations}
        planMilestones={plan.milestones}
        selectedMonthIndex={deferredMonthIndex}
        onMonthSelect={setSelectedMonthIndex}
      />
      <AllocationDetailDrawer
        allocation={selectedAllocation}
        allocations={plan.allocations}
        lastMonth={selectedMonth}
        milestones={milestones ?? []}
        projection={projection}
        planId={plan.id}
        savingBoxes={savingBoxes}
        onClose={handleDrawerClose}
      />
    </div>
  );
}

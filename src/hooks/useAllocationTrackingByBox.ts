import { useMemo } from "react";
import { usePlans } from "./usePlans";
import { usePlan } from "./usePlan";
import { useProjection } from "./useProjection";

export interface AllocationTracking {
  allocationId: string;
  label: string;
  realizationMode: string;
  accumulated: number;
  realized: number;
  available: number;
  target: number;
}

function computeTodayIndex(projection: { isReal: boolean }[]): number {
  const idx = projection.findIndex((m) => !m.isReal);
  return idx === -1 ? projection.length - 1 : idx;
}

export function useAllocationTrackingByBox(): Record<string, AllocationTracking> {
  const { plans } = usePlans();
  const activePlan = plans?.find((p) => p.status === "active") ?? plans?.[0] ?? null;
  const planId = activePlan?.id ?? null;
  const { plan } = usePlan(planId);
  const { projection } = useProjection(planId);

  return useMemo(() => {
    const result: Record<string, AllocationTracking> = {};
    if (!plan || !projection || projection.length === 0) return result;

    const todayIdx = computeTodayIndex(projection);
    const current = projection[todayIdx];

    for (const alloc of plan.allocations) {
      if (!alloc.estratoId) continue;
      if (alloc.realizationMode === "immediate" || alloc.realizationMode === "never") continue;

      const accumulated = current.allocationAccumulated?.[alloc.id] ?? 0;
      const realized = current.allocationRealized?.[alloc.id] ?? 0;

      result[alloc.estratoId] = {
        allocationId: alloc.id,
        label: alloc.label,
        realizationMode: alloc.realizationMode,
        accumulated,
        realized,
        available: accumulated - realized,
        target: alloc.target,
      };
    }

    return result;
  }, [plan, projection]);
}

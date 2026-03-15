import { memo } from "react";
import type { AllocationDTO, MonthDataDTO } from "@/services/plan.service";
import type { DerivedMilestone } from "@/utils/plan-dashboard";
import { getBoxColor } from "@/utils/box-colors";
import { AllocationCard } from "./AllocationCard";

interface Props {
  allocations: AllocationDTO[];
  lastMonth: MonthDataDTO;
  milestones: DerivedMilestone[];
  projection: MonthDataDTO[];
}

export const AllocationList = memo(function AllocationList({ allocations, lastMonth, milestones, projection }: Props) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-3">
        <span className="font-display text-base text-foreground">Alocações</span>
        <span className="font-sans text-xs text-[var(--color-text-muted)]">
          {allocations.length} {allocations.length === 1 ? "alocação" : "alocações"}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {allocations.map((allocation) => {
          const milestone = milestones.find((m) => m.boxId === allocation.id);
          const etaMonth = milestone
            ? projection.find((m) => m.month === milestone.month)
            : null;
          return (
            <AllocationCard
              key={allocation.id}
              allocation={allocation}
              allocations={allocations}
              lastMonth={lastMonth}
              eta={etaMonth ? { month: etaMonth.month, date: etaMonth.date } : null}
              color={getBoxColor(allocations, allocation.id)}
            />
          );
        })}
      </div>
    </div>
  );
});

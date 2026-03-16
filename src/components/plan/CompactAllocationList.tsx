import { memo, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { AllocationDTO, MonthDataDTO } from "@/services/plan.service";
import type { BoxDTO } from "@/services/api.interface";
import type { DerivedMilestone } from "@/utils/plan-dashboard";
import { formatCurrency, formatMonthYear } from "@/utils/plan-dashboard";
import { getBoxColor } from "@/utils/box-colors";
import { AllocationDetailDrawer } from "./AllocationDetailDrawer";

interface Props {
  allocations: AllocationDTO[];
  lastMonth: MonthDataDTO;
  milestones: DerivedMilestone[];
  projection: MonthDataDTO[];
  planId: string;
  savingBoxes: BoxDTO[];
}

export const CompactAllocationList = memo(function CompactAllocationList({
  allocations,
  lastMonth,
  milestones,
  projection,
  planId,
  savingBoxes,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedAllocation = selectedId ? allocations.find((a) => a.id === selectedId) ?? null : null;

  const sorted = useMemo(
    () => [...allocations].sort((a, b) => (lastMonth.allocations[b.id] ?? 0) - (lastMonth.allocations[a.id] ?? 0)),
    [allocations, lastMonth],
  );

  return (
    <div className="mt-1 mb-4">
      <div className="flex justify-between items-baseline mb-2.5">
        <span className="font-display text-base text-foreground">Alocações</span>
        <span className="font-sans text-[10px] text-[var(--color-text-muted)]">
          {allocations.length} {allocations.length === 1 ? "alocação" : "alocações"}
        </span>
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] overflow-hidden divide-y divide-[var(--color-border-subtle)]">
        {sorted.map((allocation) => {
          const color = getBoxColor(allocations, allocation.id);
          const balance = lastMonth.allocations[allocation.id] ?? 0;
          const hasTarget = allocation.target > 0;
          const isComplete = hasTarget && balance >= allocation.target;
          const progress = hasTarget ? Math.min(100, (balance / allocation.target) * 100) : null;
          const milestone = milestones.find((m) => m.boxId === allocation.id);
          const etaMonth = milestone ? projection.find((m) => m.month === milestone.month) : null;

          return (
            <button
              key={allocation.id}
              onClick={() => setSelectedId(allocation.id)}
              className="w-full flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-[var(--color-bg-surface-hover)] active:bg-[var(--color-bg-surface-active)] text-left min-h-[52px]"
            >
              {/* Color indicator */}
              <div
                className="w-[3px] h-8 rounded-sm shrink-0"
                style={{ background: color }}
              />

              {/* Label + meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-[13px] text-foreground truncate">
                    {allocation.label}
                  </span>
                  {isComplete && (
                    <span className="font-sans text-[8px] font-medium tracking-wider uppercase text-[var(--color-success)] bg-[var(--color-success-bg)] border border-[var(--color-success-border)] px-1 py-px rounded-full shrink-0">
                      Completo
                    </span>
                  )}
                </div>
                {/* Progress bar or ETA */}
                {progress !== null && !isComplete && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-[3px] bg-[rgba(240,232,220,0.06)] rounded-sm overflow-hidden">
                      <div
                        className="h-full rounded-sm"
                        style={{ width: `${progress}%`, background: color, opacity: 0.7 }}
                      />
                    </div>
                    <span className="font-mono text-[9px] text-[var(--color-text-muted)] shrink-0">
                      {Math.round(progress)}%
                    </span>
                  </div>
                )}
                {!hasTarget && etaMonth && (
                  <span className="font-sans text-[9px] text-[var(--color-text-muted)]">
                    {formatMonthYear(etaMonth.date)}
                  </span>
                )}
              </div>

              {/* Value */}
              <span className="font-mono text-[13px] font-medium text-foreground shrink-0">
                {formatCurrency(balance)}
              </span>

              {/* Chevron */}
              <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Detail drawer */}
      <AllocationDetailDrawer
        allocation={selectedAllocation}
        allocations={allocations}
        lastMonth={lastMonth}
        milestones={milestones}
        projection={projection}
        planId={planId}
        savingBoxes={savingBoxes}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
});

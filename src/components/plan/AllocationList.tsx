import type { BoxDTO, MonthDataDTO } from "@/services/plan.service";
import type { DerivedMilestone } from "@/utils/plan-dashboard";
import { AllocationCard } from "./AllocationCard";

interface Props {
  boxes: BoxDTO[];
  lastMonth: MonthDataDTO;
  milestones: DerivedMilestone[];
  projection: MonthDataDTO[];
}

export function AllocationList({ boxes, lastMonth, milestones, projection }: Props) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-3">
        <span className="font-display text-base text-foreground">Alocações</span>
        <span className="font-sans text-xs text-[var(--color-text-muted)]">
          {boxes.length} {boxes.length === 1 ? "alocação" : "alocações"}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {boxes.map((box) => {
          const milestone = milestones.find((m) => m.boxId === box.id);
          const etaMonth = milestone
            ? projection.find((m) => m.month === milestone.month)
            : null;
          return (
            <AllocationCard
              key={box.id}
              box={box}
              lastMonth={lastMonth}
              eta={etaMonth ? { month: etaMonth.month, date: etaMonth.date } : null}
            />
          );
        })}
      </div>
    </div>
  );
}

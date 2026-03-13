import type { PlanDTO } from "@/services/plan.service";

function formatMonthYear(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

interface Props {
  plan: PlanDTO;
  totalMonths: number;
}

export function PlanHeader({ plan, totalMonths }: Props) {
  return (
    <div className="flex items-baseline justify-between pt-5 pb-3">
      <div>
        <h1 className="font-display text-[22px] font-normal text-foreground tracking-tight">
          {plan.name}
        </h1>
        <p className="font-sans text-xs text-[var(--color-text-muted)] mt-0.5">
          {formatMonthYear(plan.startDate)} — {totalMonths} meses
        </p>
      </div>
      {plan.status === "active" && (
        <span className="font-sans text-[10px] font-medium tracking-wider uppercase text-[var(--color-success)] bg-[var(--color-success-bg)] border border-[var(--color-success-border)] px-2 py-0.5 rounded-full">
          Ativo
        </span>
      )}
    </div>
  );
}

import { cn } from "@/lib/utils";
import type { BoxDTO, MonthDataDTO, FinancingMonthDetailDTO } from "@/services/plan.service";
import { formatCurrency, formatMonthYear, getActiveMonthlyAmount } from "@/utils/plan-dashboard";
import { FinancingPhaseIndicator } from "./FinancingPhaseIndicator";

interface Props {
  box: BoxDTO;
  lastMonth: MonthDataDTO;
  eta: { month: number; date: string } | null;
}

export function AllocationCard({ box, lastMonth, eta }: Props) {
  const isHoldsFunds = box.holdsFunds;
  const balance = lastMonth.boxes[box.id] ?? 0;
  const progress = box.target > 0 ? Math.min(100, (balance / box.target) * 100) : null;
  const financing: FinancingMonthDetailDTO | undefined = lastMonth.financingDetails[box.id];
  const currentMonthly = getActiveMonthlyAmount(box.monthlyAmount, lastMonth.month);
  const isComplete = box.target > 0 && balance >= box.target;

  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] p-3.5 backdrop-blur-[12px] transition-all cursor-pointer border",
        isHoldsFunds
          ? "bg-[linear-gradient(180deg,rgba(217,175,120,0.06)_0%,rgba(217,175,120,0.015)_100%)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
          : "bg-[linear-gradient(180deg,rgba(106,159,186,0.05)_0%,rgba(106,159,186,0.01)_100%)] border-[rgba(106,159,186,0.10)] hover:border-[rgba(106,159,186,0.20)]",
      )}
    >
      {/* Top: indicator + name + badge */}
      <div className="flex justify-between items-start mb-2.5">
        <div className="flex items-center gap-2">
          <div
            className="w-[3px] h-7 rounded-sm shrink-0"
            style={{ background: isHoldsFunds ? "var(--color-data-1)" : "var(--color-info)" }}
          />
          <div>
            <div className="font-display text-sm text-foreground leading-tight">{box.label}</div>
            <div className="font-sans text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mt-px">
              {isHoldsFunds ? "Reservado para você" : "Pago a terceiros"}
            </div>
          </div>
        </div>
        <span
          className={cn(
            "font-sans text-[9px] font-medium tracking-wider uppercase px-1.5 py-0.5 rounded-full border",
            isHoldsFunds
              ? "text-[var(--color-accent)] bg-[var(--color-accent-bg)] border-[var(--color-accent-border)]"
              : "text-[var(--color-info)] bg-[var(--color-info-bg)] border-[var(--color-info-border)]",
          )}
        >
          {isHoldsFunds ? "Acúmulo" : "Pagamento"}
        </span>
      </div>

      {/* Values */}
      <div className="flex justify-between items-baseline mb-2">
        <span className="font-mono text-base font-semibold text-foreground">
          {formatCurrency(balance)}
        </span>
        <span className="font-mono text-[11px] text-[var(--color-text-muted)]">
          {box.target > 0 ? `de ${formatCurrency(box.target)}` : "sem limite"}
        </span>
      </div>

      {/* Progress bar */}
      {progress !== null && (
        <div className="h-1 bg-[rgba(240,232,220,0.06)] rounded-sm overflow-hidden mb-1.5">
          <div
            className="h-full rounded-sm transition-[width] duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: isHoldsFunds
                ? "linear-gradient(90deg, var(--color-accent-dim), var(--color-accent))"
                : "linear-gradient(90deg, rgba(106,159,186,0.6), var(--color-info))",
            }}
          />
        </div>
      )}

      {/* Meta: monthly + ETA */}
      <div className="flex justify-between items-center">
        <span className="font-mono text-[11px] text-[var(--color-text-secondary)]">
          {formatCurrency(currentMonthly)}/mês
          {financing && financing.phase === "construction" && " (juros obra)"}
        </span>
        {isComplete ? (
          <span className="font-sans text-[11px] text-[var(--color-success)]">Completo</span>
        ) : eta ? (
          <span className="font-sans text-[11px] text-[var(--color-text-muted)]">
            {formatMonthYear(eta.date)}
          </span>
        ) : box.target > 0 ? (
          <span className="font-sans text-[11px] text-[var(--color-text-muted)]">
            ~Mês {lastMonth.month}+
          </span>
        ) : null}
      </div>

      {/* Financing phase */}
      {financing && <FinancingPhaseIndicator phase={financing.phase} />}
    </div>
  );
}

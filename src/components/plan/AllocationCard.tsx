import type { BoxDTO, MonthDataDTO, FinancingMonthDetailDTO } from "@/services/plan.service";
import { formatCurrency, formatMonthYear, getActiveMonthlyAmount } from "@/utils/plan-dashboard";
import { FinancingPhaseIndicator } from "./FinancingPhaseIndicator";

interface Props {
  box: BoxDTO;
  lastMonth: MonthDataDTO;
  eta: { month: number; date: string } | null;
  color: string;
}

export function AllocationCard({ box, lastMonth, eta, color }: Props) {
  const isHoldsFunds = box.holdsFunds;
  const balance = lastMonth.boxes[box.id] ?? 0;
  const progress = box.target > 0 ? Math.min(100, (balance / box.target) * 100) : null;
  const financing: FinancingMonthDetailDTO | undefined = lastMonth.financingDetails[box.id];
  const currentMonthly = getActiveMonthlyAmount(box.monthlyAmount, lastMonth.month);
  const isComplete = box.target > 0 && balance >= box.target;

  return (
    <div
      className="rounded-[var(--radius-md)] p-3.5 backdrop-blur-[12px] transition-all cursor-pointer border border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
      style={{
        background: `linear-gradient(180deg, color-mix(in srgb, ${color} 6%, transparent) 0%, transparent 100%)`,
      }}
    >
      {/* Top: indicator + name + badge */}
      <div className="flex justify-between items-start mb-2.5">
        <div className="flex items-center gap-2">
          <div
            className="w-[3px] h-7 rounded-sm shrink-0"
            style={{ background: color }}
          />
          <div>
            <div className="font-display text-sm text-foreground leading-tight">{box.label}</div>
            <div className="font-sans text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mt-px">
              {isHoldsFunds ? "Reservado para você" : "Pago a terceiros"}
            </div>
          </div>
        </div>
        <span
          className="font-sans text-[9px] font-medium tracking-wider uppercase px-1.5 py-0.5 rounded-full border"
          style={{
            color: color,
            backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)`,
            borderColor: `color-mix(in srgb, ${color} 20%, transparent)`,
          }}
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
              background: color,
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

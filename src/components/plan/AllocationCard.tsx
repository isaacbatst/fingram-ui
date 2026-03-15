import { ArrowRight } from "lucide-react";
import type { BoxDTO, MonthDataDTO, FinancingMonthDetailDTO } from "@/services/plan.service";
import { formatCurrency, formatMonthYear, getActiveMonthlyAmount } from "@/utils/plan-dashboard";
import { FinancingPhaseIndicator } from "./FinancingPhaseIndicator";

interface Props {
  box: BoxDTO;
  boxes: BoxDTO[];
  lastMonth: MonthDataDTO;
  eta: { month: number; date: string } | null;
  color: string;
}

export function AllocationCard({ box, boxes, lastMonth, eta, color }: Props) {
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
          <div className="font-display text-sm text-foreground leading-tight">{box.label}</div>
        </div>
        <span
          className="font-sans text-[9px] font-medium tracking-wider uppercase px-1.5 py-0.5 rounded-full border"
          style={{
            color: color,
            backgroundColor: `color-mix(in srgb, ${color} 8%, transparent)`,
            borderColor: `color-mix(in srgb, ${color} 20%, transparent)`,
          }}
        >
          {isHoldsFunds ? "Reservado" : "Pago"}
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

      {/* Scheduled movements */}
      {box.scheduledMovements.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-[var(--color-border-subtle)] flex flex-col gap-2">
          {box.scheduledMovements.map((sm, i) => {
            const isIn = sm.type === 'in';
            const dotColor = isIn ? 'var(--color-success)' : 'var(--color-danger)';
            const destination = sm.type === 'out'
              ? (sm.destinationBoxId ? boxes.find(b => b.id === sm.destinationBoxId)?.label ?? 'Caixa' : 'Caixa')
              : null;
            return (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-1 h-1 rounded-full shrink-0"
                    style={{ background: dotColor }}
                  />
                  <span className="font-mono text-[11px] text-[var(--color-text-muted)]">Mês {sm.month}</span>
                  <span className="font-sans text-[11px] text-[var(--color-text-secondary)] truncate">
                    {sm.label}
                    {destination && (
                      <span className="text-[var(--color-text-muted)]">
                        <ArrowRight className="inline w-2.5 h-2.5 align-middle -mt-px mx-1" />
                        {destination}
                      </span>
                    )}
                  </span>
                </div>
                <span
                  className="font-mono text-[11px] shrink-0"
                  style={{ color: isIn ? 'var(--color-success)' : 'var(--color-text-secondary)' }}
                >
                  {isIn ? '+' : '−'}{formatCurrency(sm.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

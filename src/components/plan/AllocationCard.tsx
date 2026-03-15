import { ArrowRight } from "lucide-react";
import type { AllocationDTO, MonthDataDTO, FinancingMonthDetailDTO } from "@/services/plan.service";
import type { BoxDTO } from "@/services/api.interface";
import { formatCurrency, formatMonthYear, getActiveMonthlyAmount } from "@/utils/plan-dashboard";
import { FinancingPhaseIndicator } from "./FinancingPhaseIndicator";
import { useBindAllocation } from "@/hooks/useBindAllocation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  allocation: AllocationDTO;
  allocations: AllocationDTO[];
  lastMonth: MonthDataDTO;
  eta: { month: number; date: string } | null;
  color: string;
  planId: string;
  savingBoxes: BoxDTO[];
}

export function AllocationCard({ allocation, allocations, lastMonth, eta, color, planId, savingBoxes }: Props) {
  const isHoldsFunds = allocation.holdsFunds;
  const balance = lastMonth.allocations[allocation.id] ?? 0;
  const progress = allocation.target > 0 ? Math.min(100, (balance / allocation.target) * 100) : null;
  const financing: FinancingMonthDetailDTO | undefined = lastMonth.financingDetails[allocation.id];
  const currentMonthly = getActiveMonthlyAmount(allocation.monthlyAmount, lastMonth.month);
  const isComplete = allocation.target > 0 && balance >= allocation.target;

  const { bind, isLoading: bindLoading } = useBindAllocation(planId);

  const linkedBox = isHoldsFunds && allocation.estratoId
    ? savingBoxes.find((b) => b.id === allocation.estratoId)
    : null;

  function handleSelectChange(value: string) {
    const estratoId = value === '__none__' ? null : value;
    bind(allocation.id, estratoId);
  }

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
          <div className="font-display text-sm text-foreground leading-tight">{allocation.label}</div>
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
          {allocation.target > 0 ? `de ${formatCurrency(allocation.target)}` : "sem limite"}
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
        ) : allocation.target > 0 ? (
          <span className="font-sans text-[11px] text-[var(--color-text-muted)]">
            ~Mês {lastMonth.month}+
          </span>
        ) : null}
      </div>

      {/* Financing phase */}
      {financing && <FinancingPhaseIndicator phase={financing.phase} />}

      {/* Reserva binding selector */}
      {isHoldsFunds && (
        <div className="mt-2.5 pt-2.5 border-t border-[var(--color-border-subtle)]">
          <span className="font-sans text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1.5 block">
            Estrato vinculado
          </span>
          <Select
            value={allocation.estratoId ?? '__none__'}
            onValueChange={handleSelectChange}
            disabled={bindLoading}
          >
            <SelectTrigger
              size="sm"
              className="w-full font-sans text-xs min-h-[44px] border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)]"
            >
              <SelectValue placeholder="Vincular estrato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">
                <span className="text-[var(--color-text-muted)] italic">Sem vínculo</span>
              </SelectItem>
              {savingBoxes.map((box) => (
                <SelectItem key={box.id} value={box.id}>
                  {linkedBox?.id === box.id ? (
                    <span className="font-medium">{box.name}</span>
                  ) : (
                    box.name
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Scheduled movements */}
      {allocation.scheduledMovements.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-[var(--color-border-subtle)] flex flex-col gap-2">
          {allocation.scheduledMovements.map((sm, i) => {
            const isIn = sm.type === 'in';
            const dotColor = isIn ? 'var(--color-success)' : 'var(--color-danger)';
            const destination = sm.type === 'out'
              ? (sm.destinationBoxId ? allocations.find(b => b.id === sm.destinationBoxId)?.label ?? 'Caixa' : 'Caixa')
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

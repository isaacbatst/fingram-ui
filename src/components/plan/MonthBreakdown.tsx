import { memo, useMemo } from "react";
import type { AllocationDTO, MonthDataDTO } from "@/services/plan.service";
import { getBoxColor } from "@/utils/box-colors";
import { formatCurrency } from "@/utils/plan-dashboard";

interface Props {
  monthData: MonthDataDTO;
  allocations: AllocationDTO[];
}

export const MonthBreakdown = memo(function MonthBreakdown({ monthData, allocations }: Props) {
  const { income, costOfLiving, surplus } = monthData;

  const activePayments = useMemo(() => {
    return Object.entries(monthData.allocationPayments)
      .filter(([, amount]) => amount > 0)
      .map(([allocationId, amount]) => {
        const allocation = allocations.find((b) => b.id === allocationId);
        return {
          allocationId,
          label: allocation?.label ?? allocationId,
          amount,
          color: getBoxColor(allocations, allocationId),
        };
      });
  }, [monthData.allocationPayments, allocations]);

  const showBar = income > 0;
  const isNegativeSurplus = surplus < 0;

  return (
    <div className="mb-4">
      <span className="font-display text-base text-foreground">Movimentações</span>

      <div className="mt-2 p-3.5 bg-[linear-gradient(180deg,rgba(217,175,120,0.04)_0%,transparent_100%)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)]">
        {/* Stacked bar */}
        {showBar && (
          <div className="flex h-7 rounded overflow-hidden mb-3">
            {costOfLiving > 0 && (
              <div
                style={{
                  width: `${(costOfLiving / income) * 100}%`,
                  background: "rgba(196,92,74,0.4)",
                }}
              />
            )}
            {activePayments.map((p) => (
              <div
                key={p.allocationId}
                style={{
                  width: `${(p.amount / income) * 100}%`,
                  background: `color-mix(in srgb, ${p.color} 40%, transparent)`,
                }}
              />
            ))}
            {surplus > 0 && (
              <div
                style={{
                  width: `${(surplus / income) * 100}%`,
                  background: "rgba(184,125,138,0.35)",
                }}
              />
            )}
          </div>
        )}

        {/* Line items */}
        <div className="flex flex-col gap-2.5 text-[11px]">
          {/* Income */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-[3px] h-4 rounded-sm bg-[var(--color-success)]" />
              <span className="font-sans text-[var(--color-text-secondary)]">Receita</span>
            </div>
            <span className="font-mono text-[var(--color-success)]">{formatCurrency(income)}</span>
          </div>

          <div className="border-t border-[rgba(217,175,120,0.06)]" />

          {/* Cost of living */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="w-[3px] h-4 rounded-sm bg-[var(--color-danger)]" />
              <span className="font-sans text-[var(--color-text-secondary)]">Custo de vida</span>
            </div>
            <span className="font-mono text-[var(--color-text-secondary)]">-{formatCurrency(costOfLiving)}</span>
          </div>

          {/* Allocation payments */}
          {activePayments.map((p) => (
            <div key={p.allocationId} className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <span className="w-[3px] h-4 rounded-sm" style={{ background: p.color }} />
                <span className="font-sans text-[var(--color-text-secondary)]">{p.label}</span>
              </div>
              <span className="font-mono text-[var(--color-text-secondary)]">-{formatCurrency(p.amount)}</span>
            </div>
          ))}

          <div className="border-t border-dashed border-[rgba(217,175,120,0.15)]" />

          {/* Surplus */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span
                className="w-[3px] h-4 rounded-sm"
                style={{ background: "var(--color-flow-income)" }}
              />
              <span className="font-sans font-medium text-[var(--color-text-secondary)]">Saldo</span>
            </div>
            <span
              className="font-mono font-semibold"
              style={{ color: isNegativeSurplus ? "var(--color-danger)" : "var(--color-flow-income)" }}
            >
              {isNegativeSurplus ? "-" : "+"}{formatCurrency(Math.abs(surplus))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

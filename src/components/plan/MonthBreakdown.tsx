import { memo, useMemo } from "react";
import type { BoxDTO, MonthDataDTO } from "@/services/plan.service";
import { getBoxColor } from "@/utils/box-colors";
import { formatCurrency } from "@/utils/plan-dashboard";

interface Props {
  monthData: MonthDataDTO;
  boxes: BoxDTO[];
}

export const MonthBreakdown = memo(function MonthBreakdown({ monthData, boxes }: Props) {
  const { income, costOfLiving, surplus } = monthData;

  const activePayments = useMemo(() => {
    return Object.entries(monthData.boxPayments)
      .filter(([, amount]) => amount > 0)
      .map(([boxId, amount]) => {
        const box = boxes.find((b) => b.id === boxId);
        return {
          boxId,
          label: box?.label ?? boxId,
          amount,
          color: getBoxColor(boxes, boxId),
        };
      });
  }, [monthData.boxPayments, boxes]);

  const showBar = income > 0;
  const isNegativeSurplus = surplus < 0;

  return (
    <div className="mb-4">
      <span className="font-display text-base text-foreground">Distribuição</span>

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
                key={p.boxId}
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
                  background: "rgba(217,175,120,0.35)",
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

          {/* Box payments */}
          {activePayments.map((p) => (
            <div key={p.boxId} className="flex justify-between items-center">
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
                style={{ background: isNegativeSurplus ? "var(--color-danger)" : "var(--color-data-1)" }}
              />
              <span className="font-sans font-medium text-[var(--color-text-secondary)]">Sobra</span>
            </div>
            <span
              className="font-mono font-semibold"
              style={{ color: isNegativeSurplus ? "var(--color-danger)" : "var(--color-data-1)" }}
            >
              {isNegativeSurplus ? "-" : "+"}{formatCurrency(Math.abs(surplus))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

import { memo } from "react";
import { ChevronRight } from "lucide-react";
import { formatCompactCurrency, formatCurrency } from "@/utils/plan-dashboard";
import type { PatrimonioData, ComprometidoData } from "@/utils/plan-dashboard";

interface Props {
  patrimonio: PatrimonioData;
  comprometido: ComprometidoData;
  onAllocationClick: (allocationId: string) => void;
}

export const PatrimonioSection = memo(function PatrimonioSection({ patrimonio, comprometido, onAllocationClick }: Props) {
  const showDelta = patrimonio.delta !== null;
  const deltaColor = !showDelta
    ? undefined
    : patrimonio.delta! > 0
      ? "var(--color-success)"
      : patrimonio.delta! < 0
        ? "var(--color-danger)"
        : "var(--color-text-muted)";
  const deltaText = !showDelta
    ? undefined
    : patrimonio.delta! >= 0
      ? `+${formatCompactCurrency(patrimonio.delta!)}/mês`
      : `${formatCompactCurrency(patrimonio.delta!)}/mês`;

  // Filter out zero-value items for the bar
  const visibleItems = patrimonio.items.filter((item) => item.value > 0);
  const barTotal = visibleItems.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="my-3 flex flex-col gap-2.5">
      {/* Patrimônio card */}
      <div className="p-4 rounded-[var(--radius-md)] border border-[var(--color-accent-border)] bg-[linear-gradient(180deg,rgba(217,175,120,0.06)_0%,rgba(217,175,120,0.015)_100%)] backdrop-blur-[12px]">
        {/* Header: label + delta */}
        <div className="flex justify-between items-baseline mb-1">
          <span className="font-sans text-[10px] font-medium tracking-wider uppercase text-[var(--color-text-secondary)]">
            Patrimônio
          </span>
          {showDelta && (
            <span className="font-mono text-[10px]" style={{ color: deltaColor }}>
              {deltaText}
            </span>
          )}
        </div>

        {/* Hero value */}
        <div className="font-mono text-2xl font-semibold text-[var(--color-text-primary)] leading-tight mb-3">
          {formatCurrency(patrimonio.total)}
        </div>

        {/* Composition bar */}
        {barTotal > 0 && (
          <div className="flex h-2 rounded-sm overflow-hidden mb-3 gap-px">
            {visibleItems.map((item) => (
              <div
                key={item.id}
                style={{
                  width: `${(item.value / barTotal) * 100}%`,
                  background: item.color,
                  opacity: 0.7,
                }}
                className="first:rounded-l-sm last:rounded-r-sm"
              />
            ))}
          </div>
        )}

        {/* Composition breakdown */}
        <div className="flex flex-col">
          {patrimonio.items.map((item) => {
            const isClickable = item.id !== '__cash__';

            if (!isClickable) {
              return (
                <div key={item.id} className="flex justify-between items-center py-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-[3px] h-3.5 rounded-sm shrink-0"
                      style={{ background: item.color }}
                    />
                    <span className="font-sans text-[11px] text-[var(--color-text-secondary)]">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-foreground">
                      {formatCurrency(item.value)}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--color-text-muted)] w-[32px] text-right">
                      {item.percent}%
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => onAllocationClick(item.id)}
                className="flex justify-between items-center py-2 -mx-1 px-1 rounded-[var(--radius-sm)] transition-colors hover:bg-[var(--color-bg-surface-hover)] active:bg-[var(--color-bg-surface-active)] min-h-[44px]"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-[3px] h-3.5 rounded-sm shrink-0"
                    style={{ background: item.color }}
                  />
                  <span className="font-sans text-[11px] text-[var(--color-text-secondary)]">
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-foreground">
                    {formatCurrency(item.value)}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--color-text-muted)] w-[32px] text-right">
                    {item.percent}%
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comprometido card */}
      {comprometido.items.length > 0 && (
        <div className="p-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[linear-gradient(180deg,rgba(217,175,120,0.03)_0%,transparent_100%)] backdrop-blur-[12px]">
          {/* Header */}
          <div className="flex justify-between items-baseline mb-1">
            <div className="flex items-center gap-1.5">
              <span className="font-sans text-[10px] font-medium tracking-wider uppercase text-[var(--color-text-secondary)]">
                Comprometido
              </span>
              <span className="font-sans text-[9px] text-[var(--color-text-muted)]">
                pago a terceiros
              </span>
            </div>
            {comprometido.percentPaid !== null && (
              <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
                {comprometido.percentPaid}% pago
              </span>
            )}
          </div>

          {/* Total */}
          <div className="font-mono text-base font-semibold text-foreground leading-tight mb-2.5">
            {formatCurrency(comprometido.total)}
          </div>

          {/* Items */}
          <div className="flex flex-col">
            {comprometido.items.map((item) => (
              <button
                key={item.id}
                onClick={() => onAllocationClick(item.id)}
                className="py-2 -mx-1 px-1 rounded-[var(--radius-sm)] transition-colors hover:bg-[var(--color-bg-surface-hover)] active:bg-[var(--color-bg-surface-active)] text-left min-h-[44px]"
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-[3px] h-3.5 rounded-sm shrink-0"
                      style={{ background: item.color }}
                    />
                    <span className="font-sans text-[11px] text-[var(--color-text-secondary)]">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-foreground">
                      {formatCurrency(item.value)}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                  </div>
                </div>
                {item.target > 0 && (
                  <div className="ml-[11px] flex items-center gap-2">
                    <div className="flex-1 h-1 bg-[rgba(240,232,220,0.06)] rounded-sm overflow-hidden">
                      <div
                        className="h-full rounded-sm transition-[width] duration-500 ease-out"
                        style={{
                          width: `${item.progress}%`,
                          background: item.color,
                          opacity: 0.6,
                        }}
                      />
                    </div>
                    <span className="font-mono text-[9px] text-[var(--color-text-muted)] shrink-0">
                      {Math.round(item.progress)}%
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

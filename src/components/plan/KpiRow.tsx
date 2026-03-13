import { cn } from "@/lib/utils";
import { formatCompactCurrency } from "@/utils/plan-dashboard";
import type { KpiSet } from "@/utils/plan-dashboard";

interface KpiCardProps {
  label: string;
  value: number;
  delta: number | null;
  deltaLabel?: string;
  primary?: boolean;
}

function KpiCard({ label, value, delta, deltaLabel, primary }: KpiCardProps) {
  const showDelta = delta !== null;
  const deltaColor = !showDelta
    ? undefined
    : delta > 0
      ? "var(--color-success)"
      : delta < 0
        ? "var(--color-danger)"
        : "var(--color-text-muted)";
  const deltaText = !showDelta
    ? undefined
    : deltaLabel ??
      (delta >= 0
        ? `+${formatCompactCurrency(delta)}/mês`
        : `${formatCompactCurrency(delta)}/mês`);

  return (
    <div
      className={cn(
        "duna-surface rounded-[var(--radius-md)] p-3 backdrop-blur-[12px] transition-colors",
        primary && "border-[var(--color-accent-border)]",
      )}
    >
      <div className="font-sans text-[10px] font-medium tracking-wider uppercase text-[var(--color-text-secondary)] mb-1">
        {label}
      </div>
      <div
        className={cn(
          "font-mono text-[15px] font-semibold leading-tight",
          primary ? "text-[var(--color-accent-light)]" : "text-foreground",
        )}
      >
        {formatCompactCurrency(value)}
      </div>
      {showDelta && (
        <div className="font-mono text-[10px] mt-0.5" style={{ color: deltaColor }}>
          {deltaText}
        </div>
      )}
    </div>
  );
}

interface Props {
  kpis: KpiSet;
}

export function KpiRow({ kpis }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2 my-3">
      <KpiCard
        label="Patrimônio"
        value={kpis.patrimonio.value}
        delta={kpis.patrimonio.delta}
        primary
      />
      <KpiCard
        label="Disponível"
        value={kpis.disponivel.value}
        delta={kpis.disponivel.delta}
      />
      <KpiCard
        label="Comprometido"
        value={kpis.comprometido.value}
        delta={kpis.comprometido.delta}
        deltaLabel={
          kpis.comprometido.percent !== null
            ? `${kpis.comprometido.percent}% pago`
            : undefined
        }
      />
    </div>
  );
}

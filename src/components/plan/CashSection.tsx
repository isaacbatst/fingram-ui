import { Area, AreaChart, ReferenceLine, ResponsiveContainer, XAxis } from "recharts";
import type { MonthDataDTO } from "@/services/plan.service";
import { formatCurrency } from "@/utils/plan-dashboard";
import type { CashStats } from "@/utils/plan-dashboard";

interface Props {
  projection: MonthDataDTO[];
  stats: CashStats;
  selectedMonthIndex: number;
}

export function CashSection({ projection, stats, selectedMonthIndex }: Props) {
  const sparkData = projection.map((m) => ({ month: m.month, cash: m.cash }));
  const selectedMonth = projection[selectedMonthIndex]?.month ?? 0;
  const isNegative = stats.currentCash < 0;

  return (
    <div className="mt-6 p-3.5 bg-[linear-gradient(180deg,rgba(217,175,120,0.04)_0%,transparent_100%)] border border-[var(--color-border-subtle)] rounded-[var(--radius-md)]">
      <div className="flex justify-between items-baseline mb-2">
        <span className="font-sans text-[11px] font-medium tracking-wider uppercase text-[var(--color-text-secondary)]">
          Disponível (saldo livre)
        </span>
        <span
          className={`font-mono text-lg font-semibold ${
            isNegative ? "text-[var(--color-danger)]" : "text-foreground"
          }`}
        >
          {formatCurrency(stats.currentCash)}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={32}>
        <AreaChart data={sparkData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.15} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" hide />
          <Area
            type="monotone"
            dataKey="cash"
            stroke="var(--color-accent)"
            strokeWidth={1.5}
            strokeOpacity={0.6}
            fill="url(#sparkGrad)"
            isAnimationActive={false}
          />
          <ReferenceLine
            x={selectedMonth}
            stroke="var(--color-accent)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex justify-between font-sans text-[11px] text-[var(--color-text-muted)] mt-1">
        <span>
          Sobra média:{" "}
          <span className="font-mono text-[var(--color-success)]">
            +{formatCurrency(stats.averageSurplus)}/mês
          </span>
        </span>
      </div>
    </div>
  );
}

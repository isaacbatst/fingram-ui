import { useState, useMemo, memo, useCallback } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import type { AllocationDTO, MonthDataDTO, PlanDTO } from "@/services/plan.service";
import { formatCompactCurrency, formatCurrency } from "@/utils/plan-dashboard";

import { DATA_COLORS, getBoxColor } from "@/utils/box-colors";

type ChartView = "trajectory" | "flow";

interface Props {
  projection: MonthDataDTO[];
  allocations: AllocationDTO[];
  planMilestones: PlanDTO["milestones"];
  selectedMonthIndex: number;
  onMonthSelect: (index: number) => void;
}

export const ProjectionChart = memo(function ProjectionChart({ projection, allocations, planMilestones, selectedMonthIndex, onMonthSelect }: Props) {
  const [view, setView] = useState<ChartView>("trajectory");

  const RANGE_PRESETS = [
    { label: "1A", months: 12 },
    { label: "2A", months: 24 },
    { label: "5A", months: 60 },
    { label: "Tudo", months: Infinity },
  ] as const;

  const [rangeMonths, setRangeMonths] = useState<number>(Infinity);

  const holdsFundsAllocations = useMemo(() => allocations.filter((b) => b.holdsFunds), [allocations]);

  const visibleProjection = useMemo(
    () => rangeMonths === Infinity ? projection : projection.slice(0, rangeMonths),
    [projection, rangeMonths],
  );

  // Find the boundary month between real (past) and projected (future) data
  const todayBoundaryMonth = useMemo(() => {
    const lastRealIndex = visibleProjection.reduce<number>(
      (acc, m, i) => (m.isReal ? i : acc),
      -1,
    );
    if (lastRealIndex < 0) return null;
    return visibleProjection[lastRealIndex].month;
  }, [visibleProjection]);

  const trajectoryData = useMemo(() => visibleProjection.map((m) => {
    // For the past segment: only include values for real months, null for future
    // For the future segment: only include values for projected months, but include the
    // boundary real month so the two segments connect visually
    const isPast = m.isReal;
    const isBoundary = m.month === todayBoundaryMonth;
    const row: Record<string, number | null> = {
      month: m.month,
      isReal: m.isReal ? 1 : 0,
      // Past data key: solid line (real months + boundary)
      'Disponível': isPast ? m.cash : null,
      // Future data key: dashed line (projected months + boundary for connection)
      'Disponível (projeção)': (!isPast || isBoundary) ? m.cash : null,
    };
    holdsFundsAllocations.forEach((allocation) => {
      const val = m.allocations[allocation.id] ?? 0;
      row[allocation.label] = isPast ? val : null;
      row[`${allocation.label} (projeção)`] = (!isPast || isBoundary) ? val : null;
    });
    return row;
  }), [visibleProjection, holdsFundsAllocations, todayBoundaryMonth]);

  const { flowData, flowDomain } = useMemo(() => {
    const flowDataRaw = visibleProjection.map((m) => ({
      month: m.month,
      isReal: m.isReal ? 1 : 0,
      income: m.income,
      outflow: -(m.costOfLiving + Object.values(m.allocationPayments).reduce((s, v) => s + v, 0)),
    }));

    // Compute a Y domain that clips outliers so normal bars are visible
    const allFlowValues = flowDataRaw.flatMap((d) => [d.income, d.outflow]);
    const sorted = [...allFlowValues].sort((a, b) => Math.abs(a) - Math.abs(b));
    const p95 = Math.abs(sorted[Math.floor(sorted.length * 0.95)]);
    const flowYMax = Math.ceil(p95 * 1.3 / 10000) * 10000; // round up with padding

    const flowData = flowDataRaw.map((d) => ({
      month: d.month,
      isReal: d.isReal,
      income: d.income,
      outflow: d.outflow,
      incomeClipped: Math.min(d.income, flowYMax),
      outflowClipped: Math.max(d.outflow, -flowYMax),
    }));

    return { flowData, flowDomain: [-flowYMax, flowYMax] as [number, number] };
  }, [visibleProjection]);

  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const selectedMonth = projection[selectedMonthIndex]?.month ?? 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChartClick = useCallback((data: any) => {
    const month = data?.activePayload?.[0]?.payload?.month
      ?? (typeof data?.activeLabel === "number" ? data.activeLabel : undefined);
    if (typeof month !== "number") return;
    const idx = projection.findIndex((m) => m.month === month);
    if (idx >= 0) onMonthSelect(idx);
  }, [projection, onMonthSelect]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChartMouseMove = useCallback((data: any) => {
    const month = data?.activePayload?.[0]?.payload?.month
      ?? (typeof data?.activeLabel === "number" ? data.activeLabel : undefined);
    setHoveredMonth(typeof month === "number" ? month : null);
  }, []);

  const handleChartMouseLeave = useCallback(() => setHoveredMonth(null), []);

  const activeMonth = hoveredMonth ?? selectedMonth;
  const activeMilestone = planMilestones.find((m) => m.month === activeMonth);

  const formatXTick = (month: number) => `M${month}`;

  return (
    <div className="mb-6">
      {/* Header + Toggle + Range */}
      <div className="flex justify-between items-center mb-3">
        <span className="font-display text-base text-foreground">Projeção</span>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 bg-[rgba(217,175,120,0.04)] border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] p-0.5">
            {RANGE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setRangeMonths(preset.months)}
                className={cn(
                  "font-mono text-[10px] font-medium px-2 py-1 rounded transition-all border",
                  rangeMonths === preset.months
                    ? "bg-[var(--color-accent-bg)] text-[var(--color-accent)] border-[var(--color-accent-border)]"
                    : "bg-transparent text-[var(--color-text-muted)] border-transparent",
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="flex gap-0.5 bg-[rgba(217,175,120,0.04)] border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] p-0.5">
            {(["trajectory", "flow"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "font-sans text-[11px] font-medium px-2.5 py-1 rounded transition-all border",
                  view === v
                    ? "bg-[var(--color-accent-bg)] text-[var(--color-accent)] border-[var(--color-accent-border)]"
                    : "bg-transparent text-[var(--color-text-muted)] border-transparent",
                )}
              >
                {v === "trajectory" ? "Trajetória" : "Fluxo mensal"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-[linear-gradient(180deg,rgba(217,175,120,0.04)_0%,transparent_100%)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] p-4 pb-2">
        <ResponsiveContainer width="100%" height={180}>
          {view === "trajectory" ? (
            <AreaChart data={trajectoryData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} onClick={handleChartClick} onMouseMove={handleChartMouseMove} onMouseLeave={handleChartMouseLeave}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(217,175,120,0.04)" />
              <XAxis
                dataKey="month"
                tickFormatter={formatXTick}
                tick={{ fontSize: 9, fill: "var(--color-text-muted)", fontFamily: "var(--font-mono-family)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => formatCompactCurrency(v)}
                tick={{ fontSize: 9, fill: "var(--color-text-muted)", fontFamily: "var(--font-mono-family)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(8,9,12,0.92)",
                  border: "1px solid var(--color-border-strong)",
                  borderRadius: "var(--radius-sm)",
                  backdropFilter: "blur(16px)",
                  fontSize: 11,
                  fontFamily: "var(--font-mono-family)",
                }}
                labelFormatter={(month, payload) => {
                  const milestone = planMilestones.find((m) => m.month === month);
                  const isRealMonth = payload?.[0]?.payload?.isReal === 1;
                  const dataLabel = isRealMonth ? "Dados reais" : "Projeção";
                  const base = milestone ? `Mês ${month} — ${milestone.label}` : `Mês ${month}`;
                  return `${base} · ${dataLabel}`;
                }}
                formatter={(value, name) => {
                  // Hide projected duplicate keys from tooltip — only show real or projected, not both
                  if (String(name).endsWith(' (projeção)')) return [null, null];
                  return [formatCurrency(Number(value)), name];
                }}
              />
              {planMilestones.map((m, i) => (
                <ReferenceLine
                  key={`plan-${i}`}
                  x={m.month}
                  stroke="var(--color-accent-border)"
                  strokeDasharray="2 4"
                />
              ))}
              {/* Hoje marker at the real/projected boundary */}
              {todayBoundaryMonth !== null && (
                <ReferenceLine
                  x={todayBoundaryMonth}
                  stroke="var(--color-text-muted)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  label={{
                    value: "Hoje",
                    position: "insideTopRight",
                    fontSize: 9,
                    fill: "var(--color-text-muted)",
                    fontFamily: "var(--font-mono-family)",
                  }}
                />
              )}
              <ReferenceLine
                x={selectedMonth}
                stroke="var(--color-accent)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              {/* Past (real) — solid, full opacity */}
              <Area
                type="monotone"
                dataKey="Disponível"
                stroke={DATA_COLORS[0]}
                strokeWidth={1.5}
                fill={DATA_COLORS[0]}
                fillOpacity={0.15}
                connectNulls={false}
              />
              {/* Future (projected) — dashed, reduced opacity */}
              <Area
                type="monotone"
                dataKey="Disponível (projeção)"
                stroke={DATA_COLORS[0]}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                strokeOpacity={0.5}
                fill={DATA_COLORS[0]}
                fillOpacity={0.05}
                connectNulls={false}
                legendType="none"
              />
              {holdsFundsAllocations.flatMap((allocation) => {
                const color = getBoxColor(allocations, allocation.id);
                return [
                  <Area
                    key={allocation.id}
                    type="monotone"
                    dataKey={allocation.label}
                    stroke={color}
                    strokeWidth={1}
                    fill={color}
                    fillOpacity={0.15}
                    connectNulls={false}
                  />,
                  <Area
                    key={`${allocation.id}-proj`}
                    type="monotone"
                    dataKey={`${allocation.label} (projeção)`}
                    stroke={color}
                    strokeWidth={1}
                    strokeDasharray="4 3"
                    strokeOpacity={0.4}
                    fill={color}
                    fillOpacity={0.04}
                    connectNulls={false}
                    legendType="none"
                  />,
                ];
              })}
            </AreaChart>
          ) : (
            <BarChart data={flowData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} onClick={handleChartClick}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(217,175,120,0.04)" />
              <XAxis
                dataKey="month"
                tickFormatter={formatXTick}
                tick={{ fontSize: 9, fill: "var(--color-text-muted)", fontFamily: "var(--font-mono-family)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={flowDomain}
                tickFormatter={(v: number) => formatCompactCurrency(v)}
                tick={{ fontSize: 9, fill: "var(--color-text-muted)", fontFamily: "var(--font-mono-family)" }}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine y={0} stroke="var(--color-border-subtle)" />
              {/* Hoje marker at the real/projected boundary */}
              {todayBoundaryMonth !== null && (
                <ReferenceLine
                  x={todayBoundaryMonth}
                  stroke="var(--color-text-muted)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  label={{
                    value: "Hoje",
                    position: "insideTopRight",
                    fontSize: 9,
                    fill: "var(--color-text-muted)",
                    fontFamily: "var(--font-mono-family)",
                  }}
                />
              )}
              <ReferenceLine
                x={selectedMonth}
                stroke="var(--color-accent)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <Tooltip
                contentStyle={{
                  background: "rgba(8,9,12,0.92)",
                  border: "1px solid var(--color-border-strong)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 11,
                  fontFamily: "var(--font-mono-family)",
                }}
                labelFormatter={(month, payload) => {
                  const isRealMonth = payload?.[0]?.payload?.isReal === 1;
                  const dataLabel = isRealMonth ? "Dados reais" : "Projeção";
                  return `Mês ${month} · ${dataLabel}`;
                }}
                formatter={(_value, name, item) => {
                  const key = name as string;
                  const label = key === "incomeClipped" ? "Receita" : "Despesa";
                  const real = key === "incomeClipped"
                    ? item.payload.income
                    : Math.abs(item.payload.outflow);
                  return [formatCurrency(real), label];
                }}
              />
              <Bar dataKey="incomeClipped" name="incomeClipped" fill="var(--color-flow-income)" fillOpacity={0.7} radius={[2, 2, 0, 0]} />
              <Bar dataKey="outflowClipped" name="outflowClipped" fill="var(--color-flow-expense)" fillOpacity={0.5} radius={[0, 0, 2, 2]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      {view === "trajectory" ? (
        <div className="flex flex-wrap gap-3 pt-3">
          <span className="flex items-center gap-1.5 font-sans text-[11px] text-[var(--color-text-secondary)]">
            <span className="w-2 h-2 rounded-sm" style={{ background: DATA_COLORS[0] }} />
            Disponível
          </span>
          {holdsFundsAllocations.map((allocation) => (
            <span key={allocation.id} className="flex items-center gap-1.5 font-sans text-[11px] text-[var(--color-text-secondary)]">
              <span
                className="w-2 h-2 rounded-sm"
                style={{ background: getBoxColor(allocations, allocation.id) }}
              />
              {allocation.label}
            </span>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 pt-3">
          <span className="flex items-center gap-1.5 font-sans text-[11px] text-[var(--color-text-secondary)]">
            <span className="w-2 h-2 rounded-sm" style={{ background: "var(--color-flow-income)" }} />
            Receita
          </span>
          <span className="flex items-center gap-1.5 font-sans text-[11px] text-[var(--color-text-secondary)]">
            <span className="w-2 h-2 rounded-sm" style={{ background: "var(--color-flow-expense)" }} />
            Despesa
          </span>
        </div>
      )}

      {/* Milestone label on hover/select */}
      <div className="h-5 mt-1">
        {activeMilestone && (
          <div className="flex items-center gap-1.5 font-sans text-[11px] text-[var(--color-accent)]">
            <span className="font-mono text-[10px] text-[var(--color-text-muted)]">Mês {activeMilestone.month}</span>
            <span>{activeMilestone.label}</span>
          </div>
        )}
      </div>
    </div>
  );
});

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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AllocationDTO, MonthDataDTO, PlanDTO } from "@/services/plan.service";
import { formatCompactCurrency, formatCurrency, holdsPhysicalFunds } from "@/utils/plan-dashboard";

import { DATA_COLORS, getBoxColor } from "@/utils/box-colors";

type ChartView = "trajectory" | "flow";

interface Props {
  projection: MonthDataDTO[];
  allocations: AllocationDTO[];
  planMilestones: PlanDTO["milestones"];
  selectedMonthIndex: number;
  onMonthSelect: (index: number) => void;
  searchParams: URLSearchParams;
  setSearchParams: (params: Record<string, string>, options?: { replace?: boolean }) => void;
}

const RANGE_PRESETS = [
  { label: "6M", months: 6 },
  { label: "1A", months: 12 },
  { label: "2A", months: 24 },
  { label: "5A", months: 60 },
  { label: "Tudo", months: Infinity },
] as const;

const VALID_RANGES = new Set(RANGE_PRESETS.map(p => p.months));
const DEFAULT_RANGE = 6;

function parseRange(param: string | null): number {
  if (param === "tudo") return Infinity;
  const n = parseInt(param ?? '', 10);
  return VALID_RANGES.has(n) ? n : DEFAULT_RANGE;
}

function rangeToParam(months: number): string {
  return months === Infinity ? "tudo" : String(months);
}

export const ProjectionChart = memo(function ProjectionChart({ projection, allocations, planMilestones, selectedMonthIndex, onMonthSelect, searchParams, setSearchParams }: Props) {
  // Init from query params
  const view: ChartView = searchParams.get("modo") === "fluxo" ? "flow" : "trajectory";
  const rangeMonths = parseRange(searchParams.get("escopo"));

  const todayIndex = useMemo(() => {
    const idx = projection.findIndex(m => !m.isReal);
    return idx === -1 ? projection.length - 1 : idx;
  }, [projection]);

  const defaultOffset = useMemo(() => {
    if (rangeMonths === Infinity) return 0;
    return Math.floor(todayIndex / rangeMonths) * rangeMonths;
  }, [todayIndex, rangeMonths]);

  const pagParam = parseInt(searchParams.get("pag") ?? '', 10);
  const rangeOffset = !isNaN(pagParam) && pagParam >= 0 && pagParam < projection.length
    ? pagParam
    : defaultOffset;

  const setView = useCallback((v: ChartView) => {
    setSearchParams({ modo: v === "flow" ? "fluxo" : "trajetoria" }, { replace: true });
  }, [setSearchParams]);

  const handleRangeChange = useCallback((months: number) => {
    const offset = months === Infinity ? 0 : Math.floor(todayIndex / months) * months;
    setSearchParams({ escopo: rangeToParam(months), pag: String(offset) }, { replace: true });
  }, [todayIndex, setSearchParams]);

  const maxOffset = rangeMonths === Infinity ? 0 : Math.max(0, projection.length - rangeMonths);
  const canPageBack = rangeOffset > 0;
  const canPageForward = rangeMonths !== Infinity && rangeOffset + rangeMonths < projection.length;

  const pageBack = useCallback(() => {
    const next = Math.max(0, rangeOffset - rangeMonths);
    setSearchParams({ pag: String(next) }, { replace: true });
  }, [rangeMonths, rangeOffset, setSearchParams]);

  const pageForward = useCallback(() => {
    const next = Math.min(maxOffset, rangeOffset + rangeMonths);
    setSearchParams({ pag: String(next) }, { replace: true });
  }, [rangeMonths, rangeOffset, maxOffset, setSearchParams]);

  const holdsFundsAllocations = useMemo(() => allocations.filter(holdsPhysicalFunds), [allocations]);

  const visibleProjection = useMemo(
    () => rangeMonths === Infinity
      ? projection
      : projection.slice(rangeOffset, rangeOffset + rangeMonths),
    [projection, rangeMonths, rangeOffset],
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
    const isPast = m.isReal;
    const isBoundary = m.month === todayBoundaryMonth;
    const row: Record<string, number | null> = {
      month: m.month,
      isReal: m.isReal ? 1 : 0,
      'Disponível': isPast ? m.cash : null,
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

    const allFlowValues = flowDataRaw.flatMap((d) => [d.income, d.outflow]);
    const sorted = [...allFlowValues].sort((a, b) => Math.abs(a) - Math.abs(b));
    const p95 = Math.abs(sorted[Math.floor(sorted.length * 0.95)]);
    const flowYMax = Math.ceil(p95 * 1.3 / 10000) * 10000;

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

  // Page indicator label
  const pageLabel = rangeMonths !== Infinity
    ? `M${visibleProjection[0]?.month ?? 0}–M${visibleProjection[visibleProjection.length - 1]?.month ?? 0}`
    : null;

  return (
    <div className="mb-6">
      {/* Title + Controls: xs=stacked, sm=title+controls, lg=single row */}
      <div className="flex flex-col gap-2 mb-3 lg:flex-row lg:items-center lg:justify-between">
        <span className="font-display text-base text-foreground">Projeção</span>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex gap-0.5 bg-[rgba(217,175,120,0.04)] border border-[var(--color-border-subtle)] rounded-[var(--radius-sm)] p-0.5">
          {RANGE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handleRangeChange(preset.months)}
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
                itemSorter={(item) => String(item.name ?? '')}
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
                formatter={(value, name, item) => {
                  if (value === null || value === undefined) return [null, null];
                  const strName = String(name);
                  if (strName.endsWith(' (projeção)')) {
                    const realName = strName.replace(' (projeção)', '');
                    if (item.payload[realName] !== null && item.payload[realName] !== undefined) {
                      return [null, null];
                    }
                    return [formatCurrency(Number(value)), realName];
                  }
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
              <Area
                type="monotone"
                dataKey="Disponível"
                stroke={DATA_COLORS[0]}
                strokeWidth={1.5}
                fill={DATA_COLORS[0]}
                fillOpacity={0.15}
                connectNulls={false}
              />
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

        {/* Page navigation */}
        {rangeMonths !== Infinity && (
          <div className="flex items-center justify-center gap-3 mt-2">
            <button
              onClick={pageBack}
              disabled={!canPageBack}
              aria-label="Página anterior"
              className="p-1 rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] transition-colors enabled:hover:text-[var(--color-accent)] disabled:opacity-25"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
              {pageLabel}
            </span>
            <button
              onClick={pageForward}
              disabled={!canPageForward}
              aria-label="Próxima página"
              className="p-1 rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] transition-colors enabled:hover:text-[var(--color-accent)] disabled:opacity-25"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
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

import { useState } from "react";
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
import type { BoxDTO, MonthDataDTO } from "@/services/plan.service";
import type { DerivedMilestone } from "@/utils/plan-dashboard";
import { formatCompactCurrency, formatCurrency } from "@/utils/plan-dashboard";

const DATA_COLORS = [
  "var(--color-data-1)",
  "var(--color-data-2)",
  "var(--color-data-4)",
  "var(--color-data-3)",
  "var(--color-data-5)",
];

type ChartView = "trajectory" | "flow";

interface Props {
  projection: MonthDataDTO[];
  boxes: BoxDTO[];
  milestones: DerivedMilestone[];
  selectedMonthIndex: number;
  onMonthSelect: (index: number) => void;
}

export function ProjectionChart({ projection, boxes, milestones, selectedMonthIndex, onMonthSelect }: Props) {
  const [view, setView] = useState<ChartView>("trajectory");

  const holdsFundsBoxes = boxes.filter((b) => b.holdsFunds);

  const trajectoryData = projection.map((m) => {
    const row: Record<string, number> = { month: m.month, Disponível: m.cash };
    holdsFundsBoxes.forEach((box) => {
      row[box.label] = m.boxes[box.id] ?? 0;
    });
    return row;
  });

  const flowDataRaw = projection.map((m) => ({
    month: m.month,
    income: m.income,
    outflow: -(m.costOfLiving + Object.values(m.boxPayments).reduce((s, v) => s + v, 0)),
  }));

  // Compute a Y domain that clips outliers so normal bars are visible
  const allFlowValues = flowDataRaw.flatMap((d) => [d.income, d.outflow]);
  const sorted = [...allFlowValues].sort((a, b) => Math.abs(a) - Math.abs(b));
  const p95 = Math.abs(sorted[Math.floor(sorted.length * 0.95)]);
  const flowYMax = Math.ceil(p95 * 1.3 / 10000) * 10000; // round up with padding
  const flowDomain: [number, number] = [-flowYMax, flowYMax];

  const flowData = flowDataRaw.map((d) => ({
    month: d.month,
    income: d.income,
    outflow: d.outflow,
    incomeClipped: Math.min(d.income, flowYMax),
    outflowClipped: Math.max(d.outflow, -flowYMax),
  }));

  const selectedMonth = projection[selectedMonthIndex]?.month ?? 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChartClick = (data: any) => {
    const month = data?.activePayload?.[0]?.payload?.month;
    if (typeof month !== "number") return;
    const idx = projection.findIndex((m) => m.month === month);
    if (idx >= 0) onMonthSelect(idx);
  };

  const formatXTick = (month: number) => `M${month}`;

  return (
    <div className="mb-6">
      {/* Header + Toggle */}
      <div className="flex justify-between items-center mb-3">
        <span className="font-display text-base text-foreground">Projeção</span>
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

      {/* Chart */}
      <div className="bg-[linear-gradient(180deg,rgba(217,175,120,0.04)_0%,transparent_100%)] border border-[var(--color-border-subtle)] rounded-[var(--radius-lg)] p-4 pb-2">
        <ResponsiveContainer width="100%" height={180}>
          {view === "trajectory" ? (
            <AreaChart data={trajectoryData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} onClick={handleChartClick}>
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
                labelFormatter={(month) => `Mês ${month}`}
                formatter={(value) => formatCurrency(Number(value))}
              />
              {milestones.map((m) => (
                <ReferenceLine
                  key={m.boxId}
                  x={m.month}
                  stroke="var(--color-accent-border)"
                  strokeDasharray="3 3"
                  label={{
                    value: m.label,
                    position: "top",
                    fontSize: 9,
                    fill: "var(--color-accent)",
                  }}
                />
              ))}
              <ReferenceLine
                x={selectedMonth}
                stroke="var(--color-accent)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <Area
                type="monotone"
                dataKey="Disponível"
                stackId="1"
                stroke={DATA_COLORS[0]}
                strokeWidth={1.5}
                fill={DATA_COLORS[0]}
                fillOpacity={0.15}
              />
              {holdsFundsBoxes.map((box, i) => (
                <Area
                  key={box.id}
                  type="monotone"
                  dataKey={box.label}
                  stackId="1"
                  stroke={DATA_COLORS[(i + 1) % DATA_COLORS.length]}
                  strokeWidth={1}
                  fill={DATA_COLORS[(i + 1) % DATA_COLORS.length]}
                  fillOpacity={0.15}
                />
              ))}
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
                labelFormatter={(month) => `Mês ${month}`}
                formatter={(_value, name, item) => {
                  const key = name as string;
                  const label = key === "incomeClipped" ? "Receita" : "Despesa";
                  const real = key === "incomeClipped"
                    ? item.payload.income
                    : Math.abs(item.payload.outflow);
                  return [formatCurrency(real), label];
                }}
              />
              <Bar dataKey="incomeClipped" name="incomeClipped" fill="var(--color-success)" fillOpacity={0.7} radius={[2, 2, 0, 0]} />
              <Bar dataKey="outflowClipped" name="outflowClipped" fill="var(--color-danger)" fillOpacity={0.5} radius={[0, 0, 2, 2]} />
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
          {holdsFundsBoxes.map((box, i) => (
            <span key={box.id} className="flex items-center gap-1.5 font-sans text-[11px] text-[var(--color-text-secondary)]">
              <span
                className="w-2 h-2 rounded-sm"
                style={{ background: DATA_COLORS[(i + 1) % DATA_COLORS.length] }}
              />
              {box.label}
            </span>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 pt-3">
          <span className="flex items-center gap-1.5 font-sans text-[11px] text-[var(--color-text-secondary)]">
            <span className="w-2 h-2 rounded-sm" style={{ background: "var(--color-success)" }} />
            Receita
          </span>
          <span className="flex items-center gap-1.5 font-sans text-[11px] text-[var(--color-text-secondary)]">
            <span className="w-2 h-2 rounded-sm" style={{ background: "var(--color-danger)" }} />
            Despesa
          </span>
        </div>
      )}
    </div>
  );
}

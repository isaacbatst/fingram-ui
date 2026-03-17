import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = [
  "var(--color-data-1)",
  "var(--color-data-2)",
  "var(--color-data-4)",
  "var(--color-data-3)",
  "var(--color-data-5)",
  "var(--color-info)",
  "var(--color-success)",
  "var(--color-warning)",
];

function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

interface SliceData {
  name: string;
  value: number;
  budget?: number;
}

interface BudgetPieChartProps {
  data: SliceData[];
  total: number;
}

function CustomTooltip({
  active,
  payload,
  totalBudget,
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: SliceData & { percent: number };
  }>;
  totalBudget: number;
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const pct = (
    (entry.value / (entry.payload.percent || 1)) *
    100
  ).toFixed(0);
  const budget = entry.payload.budget;
  const plannedPct = budget && totalBudget > 0
    ? Math.round((budget / totalBudget) * 100)
    : null;
  const actualPct = Math.round(entry.value / (entry.payload.percent || 1) * 100);
  const diff = plannedPct !== null ? actualPct - plannedPct : null;

  return (
    <div className="rounded-lg border border-border bg-[var(--color-bg)] px-3 py-2 shadow-md">
      <p className="text-sm text-foreground font-display">{entry.name}</p>
      <p className="text-sm font-mono text-muted-foreground">
        {formatMoney(entry.value)}{" "}
        <span className="text-xs">({pct}%)</span>
      </p>
      {diff !== null && diff !== 0 && (
        <p
          className="text-xs font-mono mt-0.5"
          style={{ color: diff > 0 ? "var(--color-danger)" : "var(--color-success)" }}
        >
          {diff > 0 ? "+" : ""}{diff}pp vs planejado ({plannedPct}%)
        </p>
      )}
    </div>
  );
}

export function BudgetPieChart({ data, total }: BudgetPieChartProps) {
  const filtered = data.filter((d) => d.value > 0);

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-sm text-muted-foreground">
        Sem dados para exibir
      </div>
    );
  }

  const totalBudget = filtered.reduce((sum, d) => sum + (d.budget ?? 0), 0);
  const hasBudgetInfo = totalBudget > 0;

  // Add percent field for tooltip calculation
  const enriched = filtered.map((d) => ({
    ...d,
    percent: total > 0 ? total : 1,
  }));

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={enriched}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={85}
              cornerRadius={3}
              paddingAngle={2}
              strokeWidth={0}
            >
              {enriched.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip totalBudget={totalBudget} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="w-full space-y-1.5 px-2">
        {enriched.map((entry, index) => {
          const sharePct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
          const plannedSharePct = hasBudgetInfo && entry.budget
            ? Math.round((entry.budget / totalBudget) * 100)
            : null;
          const diff = plannedSharePct !== null ? sharePct - plannedSharePct : null;

          return (
            <div key={entry.name} className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-xs text-muted-foreground truncate">
                {entry.name}
              </span>
              <span
                className="text-xs font-mono ml-auto shrink-0"
                style={{
                  color: diff !== null && diff !== 0
                    ? diff > 0 ? "var(--color-danger)" : "var(--color-success)"
                    : "var(--color-text)",
                }}
              >
                {sharePct}%
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground font-mono">
        Total: {formatMoney(total)}
      </p>
    </div>
  );
}

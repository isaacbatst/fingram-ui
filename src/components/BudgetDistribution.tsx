import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import {
  buildDistribution,
  type DistributionSlice,
} from "./budget-distribution.utils";

type Item = {
  categoryId: string;
  categoria: string;
  valor: number;
  usado: number;
};

function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const pct = (share: number) => Math.round(share * 100);

function SliceTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DistributionSlice }>;
}) {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-[var(--color-bg)] px-3 py-2 shadow-md">
      <p className="text-sm font-display text-foreground">
        {s.label}
        {s.count > 1 && (
          <span className="text-xs font-sans text-muted-foreground">
            {" "}
            · {s.count} categorias
          </span>
        )}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Planejado{" "}
        <span className="font-mono text-foreground">
          {formatMoney(s.planned)}
        </span>{" "}
        <span className="font-mono">({pct(s.plannedShare)}%)</span>
      </p>
      <p className="text-xs text-muted-foreground">
        Executado{" "}
        <span className="font-mono text-foreground">
          {formatMoney(s.executed)}
        </span>{" "}
        <span className="font-mono">({pct(s.executedShare)}%)</span>
      </p>
    </div>
  );
}

/** Diferença, em pontos percentuais, entre a fatia no gasto e no plano. */
function ShareDelta({
  slice,
  hasSpending,
}: {
  slice: DistributionSlice;
  hasSpending: boolean;
}) {
  // Sem gasto ainda não há divisão a comparar: "−54 pp" seria ruído.
  if (!hasSpending) {
    return <span className="text-muted-foreground">—</span>;
  }
  const diff = pct(slice.executedShare) - pct(slice.plannedShare);
  if (diff === 0) {
    return <span className="text-muted-foreground">=</span>;
  }
  const Icon = diff > 0 ? ArrowUpIcon : ArrowDownIcon;
  return (
    <span className="inline-flex items-center justify-end gap-0.5 text-foreground">
      <Icon className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
      {Math.abs(diff)} pp
    </span>
  );
}

/**
 * Como o dinheiro se divide entre as categorias: o anel de dentro é o plano, o
 * de fora é o que foi gasto. As fatias começam no mesmo ponto e seguem a mesma
 * ordem nos dois anéis, então uma categoria que cresceu no gasto aparece como
 * um arco mais longo por fora do que por dentro. A lista mostra valores; aqui
 * o assunto é proporção.
 */
export function BudgetDistribution({
  items,
  onDrillCategory,
}: {
  items: Item[];
  onDrillCategory: (categoryId: string) => void;
}) {
  const { slices, totalPlanned, totalExecuted } = buildDistribution(items);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  if (slices.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
        Nenhuma categoria com orçamento neste mês
      </div>
    );
  }

  const opacityFor = (key: string) =>
    activeKey === null || activeKey === key ? 1 : 0.3;
  const hasSpending = totalExecuted > 0;
  const usedPct =
    totalPlanned > 0 ? Math.round((totalExecuted / totalPlanned) * 100) : 0;

  // Mesmo sentido e origem nos dois anéis (12h, horário).
  const ring = {
    dataKey: "",
    nameKey: "label",
    cx: "50%",
    cy: "50%",
    startAngle: 90,
    endAngle: -270,
    stroke: "var(--color-bg)",
    strokeWidth: 2,
    isAnimationActive: false,
  } as const;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
      <figure className="flex flex-col items-center gap-2 shrink-0">
        <div className="relative h-56 w-56">
          <PieChart width={224} height={224}>
            <Pie
              {...ring}
              data={slices}
              dataKey="planned"
              innerRadius={50}
              outerRadius={70}
              onMouseLeave={() => setActiveKey(null)}
            >
              {slices.map((s) => (
                <Cell
                  key={s.key}
                  fill={s.color}
                  fillOpacity={opacityFor(s.key)}
                  onMouseEnter={() => setActiveKey(s.key)}
                />
              ))}
            </Pie>
            {hasSpending ? (
              <Pie
                {...ring}
                data={slices}
                dataKey="executed"
                innerRadius={78}
                outerRadius={108}
                onMouseLeave={() => setActiveKey(null)}
              >
                {slices.map((s) => (
                  <Cell
                    key={s.key}
                    fill={s.color}
                    fillOpacity={opacityFor(s.key)}
                    onMouseEnter={() => setActiveKey(s.key)}
                  />
                ))}
              </Pie>
            ) : (
              <Pie
                {...ring}
                data={[{ value: 1 }]}
                dataKey="value"
                innerRadius={78}
                outerRadius={108}
                fill="var(--color-border)"
                stroke="none"
                tooltipType="none"
              />
            )}
            <Tooltip content={<SliceTooltip />} wrapperStyle={{ zIndex: 10 }} />
          </PieChart>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-mono text-foreground">
              {usedPct}%
            </span>
            <span className="text-[10px] text-muted-foreground">do plano</span>
          </div>
        </div>
        <figcaption className="text-xs text-muted-foreground text-center">
          Dentro: planejado · Fora: executado
        </figcaption>
      </figure>

      <div className="flex-1 min-w-0">
        <div className="grid grid-cols-[1fr_3rem_3rem_3.5rem] gap-x-2 px-2 pb-1 text-[11px] text-muted-foreground">
          <span>Categoria</span>
          <span className="text-right">Plano</span>
          <span className="text-right">Gasto</span>
          <span className="text-right">Dif.</span>
        </div>
        <ul>
          {slices.map((s) => {
            const summary = `${s.label}: ${pct(s.plannedShare)}% do planejado (${formatMoney(
              s.planned,
            )})${
              hasSpending
                ? ` e ${pct(s.executedShare)}% do executado (${formatMoney(s.executed)})`
                : ", nada gasto ainda"
            }`;
            const content = (
              <>
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: s.color }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-sm font-display text-foreground">
                    {s.label}
                  </span>
                  {s.count > 1 && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      ({s.count})
                    </span>
                  )}
                </span>
                <span className="text-right text-muted-foreground">
                  {pct(s.plannedShare)}%
                </span>
                <span className="text-right text-foreground">
                  {hasSpending ? `${pct(s.executedShare)}%` : "—"}
                </span>
                <span className="text-right">
                  <ShareDelta slice={s} hasSpending={hasSpending} />
                </span>
              </>
            );
            const rowClass =
              "grid w-full min-h-11 grid-cols-[1fr_3rem_3rem_3.5rem] items-center gap-x-2 rounded-lg px-2 text-left text-xs font-mono transition-opacity";

            return (
              <li
                key={s.key}
                onMouseEnter={() => setActiveKey(s.key)}
                onMouseLeave={() => setActiveKey(null)}
                style={{
                  opacity: activeKey === null || activeKey === s.key ? 1 : 0.5,
                }}
              >
                {s.categoryId ? (
                  <button
                    type="button"
                    title={summary}
                    aria-label={summary}
                    onClick={() => onDrillCategory(s.categoryId!)}
                    onFocus={() => setActiveKey(s.key)}
                    onBlur={() => setActiveKey(null)}
                    className={`${rowClass} hover:bg-[var(--color-bg-surface-hover)] active:bg-[var(--color-bg-surface-active)]`}
                  >
                    {content}
                  </button>
                ) : (
                  <div
                    className={rowClass}
                    title={summary}
                    aria-label={summary}
                    role="group"
                  >
                    {content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-2 px-2 text-xs text-muted-foreground">
          <span className="font-mono">{formatMoney(totalExecuted)}</span> gastos
          de <span className="font-mono">{formatMoney(totalPlanned)}</span>{" "}
          planejados
        </p>
      </div>
    </div>
  );
}

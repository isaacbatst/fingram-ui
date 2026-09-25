import { AlertTriangleIcon } from "lucide-react";

type Item = {
  categoryId: string;
  categoria: string;
  /** Orçado (planejado) no período. */
  valor: number;
  /** Gasto (executado) no período. */
  usado: number;
};

// Série "Executado": o acento, um passo mais escuro para ficar na faixa de
// luminosidade de gráfico sobre o fundo escuro. "Planejado" é a referência:
// um neutro quente, recessivo. Validado com o validador de paleta (dataviz):
// separação para daltonismo ΔE 18 e contraste ≥ 3:1 sobre #08090c. A identidade
// não depende só da cor: a barra planejada é mais fina e há legenda e valores.
const PLANNED_COLOR = "#6f675c";
const EXECUTED_COLOR = "#c9954f";

function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/** Largura da barra na escala comum; valores > 0 nunca somem. */
function barWidth(value: number, max: number): string {
  if (value <= 0 || max <= 0) return "0";
  return `max(${((value / max) * 100).toFixed(2)}%, 3px)`;
}

/**
 * Planejado × executado por categoria, numa escala só: dá para comparar uma
 * categoria com o próprio orçamento e com as outras. Substitui as duas pizzas
 * separadas, que obrigavam a alternar entre abas para comparar.
 */
export function BudgetComparison({
  items,
  onDrillCategory,
}: {
  items: Item[];
  onDrillCategory: (categoryId: string) => void;
}) {
  const sorted = [...items].sort((a, b) => b.valor - a.valor);
  const max = Math.max(0, ...items.map((i) => Math.max(i.valor, i.usado)));
  const totalPlanned = items.reduce((sum, i) => sum + i.valor, 0);
  const totalExecuted = items.reduce((sum, i) => sum + i.usado, 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-3" aria-hidden="true">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-1.5 w-4 rounded-full"
              style={{ backgroundColor: PLANNED_COLOR }}
            />
            Planejado
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-4 rounded-full"
              style={{ backgroundColor: EXECUTED_COLOR }}
            />
            Executado
          </span>
        </div>
        <span className="font-mono">
          {formatMoney(totalExecuted)} de {formatMoney(totalPlanned)}
        </span>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
        {sorted.map((item) => {
          const diff = item.usado - item.valor;
          const pct = item.valor > 0 ? Math.round((item.usado / item.valor) * 100) : null;
          const summary = `${item.categoria}: executado ${formatMoney(item.usado)} de ${formatMoney(item.valor)} planejado${
            pct !== null ? ` (${pct}%)` : ""
          }${diff > 0 ? `, ${formatMoney(diff)} acima` : ""}`;

          return (
            <li key={item.categoryId}>
              <button
                type="button"
                title={summary}
                aria-label={summary}
                onClick={() => onDrillCategory(item.categoryId)}
                className="w-full min-h-11 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-[var(--color-bg-surface-hover)] active:bg-[var(--color-bg-surface-active)]"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-display text-foreground truncate">
                    {item.categoria}
                  </span>
                  <span className="flex items-baseline gap-2 shrink-0 text-xs font-mono">
                    <span className="text-foreground">{formatMoney(item.usado)}</span>
                    <span className="text-muted-foreground">
                      / {formatMoney(item.valor)}
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 flex flex-col gap-0.5">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: barWidth(item.valor, max),
                      backgroundColor: PLANNED_COLOR,
                    }}
                  />
                  <div
                    className="h-2.5 rounded-full"
                    style={{
                      width: barWidth(item.usado, max),
                      backgroundColor: EXECUTED_COLOR,
                    }}
                  />
                </div>
                {diff > 0 && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-[var(--color-danger)]">
                    <AlertTriangleIcon className="h-3 w-3" aria-hidden="true" />
                    {formatMoney(diff)} acima do planejado
                  </p>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

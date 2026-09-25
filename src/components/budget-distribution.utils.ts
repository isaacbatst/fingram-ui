type BudgetItem = {
  categoryId: string;
  categoria: string;
  /** Orçado (planejado) no período. */
  valor: number;
  /** Gasto (executado) no período. */
  usado: number;
};

export type DistributionSlice = {
  key: string;
  /** null para a fatia "Outras". */
  categoryId: string | null;
  label: string;
  planned: number;
  executed: number;
  /** Fração (0–1) do total planejado. */
  plannedShare: number;
  /** Fração (0–1) do total executado. */
  executedShare: number;
  color: string;
  /** Quantas categorias a fatia representa (> 1 só em "Outras"). */
  count: number;
};

// Categóricas para o fundo escuro (#08090c), na ordem em que são atribuídas.
// Validadas com o validador de paleta (dataviz) como anel fechado, incluindo o
// par último↔primeiro: L 0.48–0.67, croma ≥ 0.10, separação para daltonismo
// ΔE ≥ 9.3, visão normal ΔE ≥ 19.8, contraste ≥ 3:1. Nenhuma é vermelha, para
// não se confundir com --color-danger.
export const DISTRIBUTION_COLORS = [
  "#b48c2b", // âmbar
  "#455bb2", // azul
  "#34a08e", // verde-água
  "#b2511e", // terracota
  "#966ab5", // violeta
];
/** "Outras" é neutra: agrupa, não é uma categoria. */
export const OTHERS_COLOR = "#6f675c";

/** Pizza legível: no máximo 6 fatias (5 categorias + "Outras"). */
const MAX_SLICES = DISTRIBUTION_COLORS.length + 1;

const share = (value: number, total: number) => (total > 0 ? value / total : 0);

/**
 * Divide o orçamento do período em fatias comparáveis entre planejado e
 * executado. Com mais de 6 categorias, ficam as 5 de maior peso — no plano ou
 * no gasto, para não esconder uma categoria pouco planejada que estourou — e o
 * resto vira "Outras". As fatias seguem a ordem do plano, então os dois anéis
 * começam no mesmo ponto e a mesma categoria tem a mesma cor em ambos.
 */
export function buildDistribution(items: BudgetItem[]): {
  slices: DistributionSlice[];
  totalPlanned: number;
  totalExecuted: number;
} {
  const totalPlanned = items.reduce((sum, i) => sum + i.valor, 0);
  const totalExecuted = items.reduce((sum, i) => sum + i.usado, 0);

  const weight = (i: BudgetItem) =>
    Math.max(share(i.valor, totalPlanned), share(i.usado, totalExecuted));

  let named = items;
  let rest: BudgetItem[] = [];
  if (items.length > MAX_SLICES) {
    const ranked = [...items].sort((a, b) => weight(b) - weight(a));
    named = ranked.slice(0, MAX_SLICES - 1);
    rest = ranked.slice(MAX_SLICES - 1);
  }

  const slices: DistributionSlice[] = [...named]
    .sort((a, b) => b.valor - a.valor)
    .map((i, index) => ({
      key: i.categoryId,
      categoryId: i.categoryId,
      label: i.categoria,
      planned: i.valor,
      executed: i.usado,
      plannedShare: share(i.valor, totalPlanned),
      executedShare: share(i.usado, totalExecuted),
      color: DISTRIBUTION_COLORS[index],
      count: 1,
    }));

  if (rest.length > 0) {
    const planned = rest.reduce((sum, i) => sum + i.valor, 0);
    const executed = rest.reduce((sum, i) => sum + i.usado, 0);
    slices.push({
      key: "outras",
      categoryId: null,
      label: "Outras",
      planned,
      executed,
      plannedShare: share(planned, totalPlanned),
      executedShare: share(executed, totalExecuted),
      color: OTHERS_COLOR,
      count: rest.length,
    });
  }

  return { slices, totalPlanned, totalExecuted };
}

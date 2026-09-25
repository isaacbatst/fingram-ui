import type { ActivityData } from "@/services/api.interface";

export type Dia = {
  key: string;
  date: Date;
  count: number;
  expenseTotal: number;
  isFuture: boolean;
};

/** Chave YYYY-MM-DD em UTC, igual à que o backend devolve. */
export const chaveUtc = (date: Date) => date.toISOString().slice(0, 10);

/**
 * A mesma janela que o backend calcula em `getDailyActivity`: começa no domingo
 * da semana de `weeks * 7 - 1` dias atrás e termina amanhã (exclusivo).
 *
 * Serve ao esqueleto: com ela o grid de carregamento tem as mesmas colunas do
 * grid real, e como as células são quadradas, a mesma altura — nada pula quando
 * os dados chegam.
 */
export function janelaDeAtividade(
  weeks: number,
  now: Date = new Date(),
): { startDate: Date; endDate: Date } {
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );

  const startDate = new Date(today);
  startDate.setUTCDate(startDate.getUTCDate() - (weeks * 7 - 1));
  startDate.setUTCDate(startDate.getUTCDate() - startDate.getUTCDay());

  const endDate = new Date(today);
  endDate.setUTCDate(endDate.getUTCDate() + 1);

  return { startDate, endDate };
}

/** Quebra a janela em colunas de semana, de domingo a sábado. */
export function montarSemanas(
  inicio: Date,
  fim: Date,
  days: ActivityData["days"],
  now: Date = new Date(),
): Dia[][] {
  const porDia = new Map(days.map((d) => [d.date, d]));
  const hojeKey = chaveUtc(now);

  const colunas: Dia[][] = [];
  let coluna: Dia[] = [];

  for (
    const cursor = new Date(inicio);
    cursor < fim;
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  ) {
    const key = chaveUtc(cursor);
    const registro = porDia.get(key);
    coluna.push({
      key,
      date: new Date(cursor),
      count: registro?.count ?? 0,
      expenseTotal: registro?.expenseTotal ?? 0,
      isFuture: key > hojeKey,
    });

    if (coluna.length === 7) {
      colunas.push(coluna);
      coluna = [];
    }
  }
  // A última semana costuma vir incompleta: hoje raramente é sábado.
  if (coluna.length > 0) colunas.push(coluna);

  return colunas;
}

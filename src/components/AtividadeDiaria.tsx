import { useMemo } from "react";
import useSWR from "swr";
import { useApi } from "@/hooks/useApi";
import type { ActivityData } from "@/services/api.interface";

/** Quantas semanas o grid cobre. Cabe em tela estreita sem rolagem. */
const WEEKS = 20;

/**
 * Faixas de intensidade por número de lançamentos no dia.
 *
 * Calibradas para finanças pessoais, onde um dia movimentado tem poucas unidades
 * — não a dezena que faria sentido num gráfico de commits.
 */
const level = (count: number): 0 | 1 | 2 | 3 | 4 => {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
};

const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
/** Só três rótulos, como o GitHub: mais que isso vira ruído numa coluna estreita. */
const LINHAS_COM_ROTULO = new Set([1, 3, 5]);

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

/** Chave YYYY-MM-DD em UTC, igual à que o backend devolve. */
const chaveUtc = (date: Date) => date.toISOString().slice(0, 10);

const formatMoney = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

type Dia = {
  key: string;
  date: Date;
  count: number;
  expenseTotal: number;
  isFuture: boolean;
};

/**
 * Grid de dias com lançamento, no formato do GitHub.
 *
 * Serve menos para consultar valor e mais para enxergar constância: onde ficaram
 * os buracos, se o registro virou hábito. O valor gasto aparece só no tooltip.
 */
export function AtividadeDiaria() {
  const { apiService, isAuthenticated } = useApi();

  const { data } = useSWR<ActivityData>(
    isAuthenticated ? ["activity", WEEKS] : null,
    () => apiService.getActivity(WEEKS),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );

  const semanas = useMemo(() => {
    if (!data) return [];

    const porDia = new Map(data.days.map((d) => [d.date, d]));
    const inicio = new Date(data.startDate);
    const fim = new Date(data.endDate);
    const hojeKey = chaveUtc(new Date());

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
  }, [data]);

  // Sem dados ainda: nada a mostrar, e um esqueleto piscando aqui só faria barulho.
  if (semanas.length === 0) return null;

  const rotulosDeMes = semanas.map((semana, index) => {
    const mes = semana[0].date.getUTCMonth();
    const anterior = index > 0 ? semanas[index - 1][0].date.getUTCMonth() : -1;
    return mes !== anterior ? MESES[mes] : null;
  });

  return (
    <section className="flex flex-col gap-1.5" aria-label="Dias com lançamento">
      <div className="flex gap-1">
        {/* Coluna de rótulos de dia, alinhada com as linhas do grid */}
        <div className="flex flex-col gap-[3px] pt-[14px] shrink-0">
          {DIAS_SEMANA.map((dia, linha) => (
            <span
              key={dia}
              className="h-3 text-[9px] leading-3 text-muted-foreground w-6 text-right pr-0.5"
            >
              {LINHAS_COM_ROTULO.has(linha) ? dia : ""}
            </span>
          ))}
        </div>

        <div className="flex-1 min-w-0">
          {/* Rótulos de mês.
              `min-w-0` é o que mantém a régua alinhada: sem ele o min-width do
              flex é o conteúdo, e o rótulo com texto rouba largura dos vizinhos —
              medido em ±2px de deriva, quase 20% de uma coluna. Com min-w-0 as
              colunas ficam idênticas e o texto transborda por cima da seguinte. */}
          <div className="flex gap-[3px] h-[14px]">
            {rotulosDeMes.map((rotulo, index) => (
              <span
                key={semanas[index][0].key}
                className="flex-1 min-w-0 text-[9px] leading-[14px] text-muted-foreground overflow-visible whitespace-nowrap"
              >
                {rotulo}
              </span>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {semanas.map((semana) => (
              <div key={semana[0].key} className="flex-1 flex flex-col gap-[3px]">
                {semana.map((dia) => (
                  <div
                    key={dia.key}
                    title={
                      dia.isFuture
                        ? ""
                        : `${dia.count} ${dia.count === 1 ? "lançamento" : "lançamentos"}${
                            dia.expenseTotal > 0
                              ? ` · ${formatMoney(dia.expenseTotal)}`
                              : ""
                          } em ${dia.date.getUTCDate()} ${MESES[dia.date.getUTCMonth()]}`
                    }
                    className="h-3 rounded-[2px]"
                    style={{
                      backgroundColor: dia.isFuture
                        ? "transparent"
                        : `var(--color-heat-${level(dia.count)})`,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1 text-[9px] text-muted-foreground">
        <span>menos</span>
        {[0, 1, 2, 3, 4].map((nivel) => (
          <span
            key={nivel}
            className="w-3 h-3 rounded-[2px] inline-block"
            style={{ backgroundColor: `var(--color-heat-${nivel})` }}
          />
        ))}
        <span>mais</span>
      </div>
    </section>
  );
}

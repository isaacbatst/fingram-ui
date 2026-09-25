import { describe, expect, it } from "vitest";
import { janelaDeAtividade, montarSemanas } from "./atividade-diaria.utils";

// 2026-09-20 é domingo; a semana vai até 2026-09-26, sábado.
const diaDaSemana = (utcDay: number) =>
  new Date(Date.UTC(2026, 8, 20 + utcDay, 15));

describe("janelaDeAtividade", () => {
  it("começa num domingo e termina amanhã, exclusivo", () => {
    const now = new Date(Date.UTC(2026, 8, 25, 13, 30));
    const { startDate, endDate } = janelaDeAtividade(20, now);

    expect(startDate.getUTCDay()).toBe(0);
    expect(startDate.toISOString()).toBe("2026-05-03T00:00:00.000Z");
    expect(endDate.toISOString()).toBe("2026-09-26T00:00:00.000Z");
  });

  it("dá 20 colunas cheias no sábado", () => {
    const now = diaDaSemana(6);
    const { startDate, endDate } = janelaDeAtividade(20, now);
    const semanas = montarSemanas(startDate, endDate, [], now);

    expect(semanas).toHaveLength(20);
    expect(semanas.every((s) => s.length === 7)).toBe(true);
  });

  it.each([0, 1, 2, 3, 4, 5])(
    "dá 21 colunas, a última até hoje, no dia %i da semana",
    (utcDay) => {
      const now = diaDaSemana(utcDay);
      const { startDate, endDate } = janelaDeAtividade(20, now);
      const semanas = montarSemanas(startDate, endDate, [], now);

      expect(semanas).toHaveLength(21);
      expect(semanas[20]).toHaveLength(utcDay + 1);
      expect(semanas[20].at(-1)?.key).toBe(now.toISOString().slice(0, 10));
    },
  );
});

describe("montarSemanas", () => {
  it("preenche contagem e total a partir dos dias do backend", () => {
    const now = diaDaSemana(2);
    const { startDate, endDate } = janelaDeAtividade(1, now);
    const semanas = montarSemanas(
      startDate,
      endDate,
      [{ date: "2026-09-21", count: 3, expenseTotal: 42 }],
      now,
    );

    const segunda = semanas.flat().find((d) => d.key === "2026-09-21");
    expect(segunda).toMatchObject({ count: 3, expenseTotal: 42 });
    expect(semanas.flat().every((d) => !d.isFuture)).toBe(true);
  });
});

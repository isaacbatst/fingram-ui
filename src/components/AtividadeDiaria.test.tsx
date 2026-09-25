import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import type { ActivityData } from "@/services/api.interface";
import { AtividadeDiaria } from "./AtividadeDiaria";
import { janelaDeAtividade } from "./atividade-diaria.utils";

const getActivity = vi.fn<(weeks?: number) => Promise<ActivityData>>();

vi.mock("@/hooks/useApi", () => ({
  useApi: () => ({ apiService: { getActivity }, isAuthenticated: true }),
}));

const renderGrid = () =>
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <AtividadeDiaria />
    </SWRConfig>,
  );

const grid = () => screen.queryByLabelText("Dias com lançamento");

describe("AtividadeDiaria", () => {
  // Corpo em bloco: função devolvida pelo beforeEach vira teardown no vitest,
  // e mockReset devolve o próprio mock — ele seria chamado após cada teste.
  beforeEach(() => {
    getActivity.mockReset();
  });

  it("mostra o esqueleto com as mesmas colunas enquanto carrega", async () => {
    let resolver: (data: ActivityData) => void = () => {};
    getActivity.mockReturnValue(new Promise((r) => (resolver = r)));

    renderGrid();

    const esqueleto = grid();
    expect(esqueleto).not.toBeNull();
    expect(esqueleto!.getAttribute("aria-busy")).toBe("true");
    const celulasEsqueleto = esqueleto!.querySelectorAll(".aspect-square");
    expect(celulasEsqueleto.length).toBeGreaterThan(0);
    expect(
      [...celulasEsqueleto].every((c) => c.classList.contains("animate-pulse")),
    ).toBe(true);

    const { startDate, endDate } = janelaDeAtividade(20);
    resolver({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      days: [],
    });

    await waitFor(() =>
      expect(grid()!.getAttribute("aria-busy")).toBe("false"),
    );
    const celulas = grid()!.querySelectorAll(".aspect-square");
    expect(celulas.length).toBe(celulasEsqueleto.length);
    expect(grid()!.querySelector(".animate-pulse")).toBeNull();
  });

  it("some quando a busca falha", async () => {
    getActivity.mockRejectedValue(new Error("falhou"));

    renderGrid();

    await waitFor(() => expect(grid()).toBeNull());
  });
});

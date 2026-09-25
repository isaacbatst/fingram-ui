import { describe, expect, it } from "vitest";
import { readCardScreen } from "./useCardNav";

const screen = (query: string) => readCardScreen(new URLSearchParams(query));

describe("readCardScreen", () => {
  it("should show the Estratos list without card params", () => {
    expect(screen("aba=estratos")).toEqual({ kind: "list" });
  });

  it("should open a card", () => {
    expect(screen("aba=estratos&cartao=c1")).toEqual({ kind: "card", cardId: "c1" });
  });

  it("should open an invoice, keeping the card to go back to", () => {
    expect(screen("fatura=i1&cartao=c1")).toEqual({ kind: "invoice", invoiceId: "i1", cardId: "c1" });
    expect(screen("fatura=i1")).toEqual({ kind: "invoice", invoiceId: "i1", cardId: null });
  });

  it("should open the duplicates and reprocess screens", () => {
    expect(screen("cartoes=duplicatas")).toEqual({ kind: "duplicates" });
    expect(screen("cartoes=reprocessar")).toEqual({ kind: "reprocess" });
    expect(screen("cartoes=outra")).toEqual({ kind: "list" });
  });
});

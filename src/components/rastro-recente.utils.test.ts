import { describe, it, expect } from "vitest";
import {
  MAX_ROWS,
  OPACITY_FLOOR,
  formatAmount,
  getRowOpacity,
  getRowVisual,
} from "./rastro-recente.utils";
import type { TransactionDTO } from "@/utils/transaction.dto,";

function buildTx(overrides: Partial<TransactionDTO> = {}): TransactionDTO {
  return {
    id: "tx-1",
    code: "001",
    description: "Pão na padaria",
    amount: 12.5,
    isCommitted: true,
    createdAt: new Date("2026-04-17T14:00:00Z"),
    date: new Date("2026-04-17T00:00:00Z"),
    type: "expense",
    vaultId: "v1",
    boxId: "b1",
    transferId: null,
    transferToBoxId: null,
    category: null,
    ...overrides,
  };
}

describe("getRowOpacity", () => {
  it("returns 1 for the first row", () => {
    expect(getRowOpacity(0)).toBe(1);
  });

  it("decays by OPACITY_DECAY per index", () => {
    expect(getRowOpacity(1)).toBeCloseTo(0.88, 5);
    expect(getRowOpacity(2)).toBeCloseTo(0.76, 5);
    expect(getRowOpacity(3)).toBeCloseTo(0.64, 5);
  });

  it("floors at OPACITY_FLOOR (0.5) regardless of index", () => {
    expect(getRowOpacity(5)).toBe(OPACITY_FLOOR);
    expect(getRowOpacity(10)).toBe(OPACITY_FLOOR);
    expect(getRowOpacity(100)).toBe(OPACITY_FLOOR);
  });

  it("never returns below the floor for valid row indices (0..MAX_ROWS-1)", () => {
    for (let i = 0; i < MAX_ROWS; i++) {
      expect(getRowOpacity(i)).toBeGreaterThanOrEqual(OPACITY_FLOOR);
      expect(getRowOpacity(i)).toBeLessThanOrEqual(1);
    }
  });
});

describe("formatAmount", () => {
  it("formats with pt-BR thousands separator and 2 decimals", () => {
    expect(formatAmount(1234.5)).toBe("1.234,50");
  });

  it("always shows 2 decimals", () => {
    expect(formatAmount(10)).toBe("10,00");
  });

  it("uses absolute value (no sign)", () => {
    expect(formatAmount(-42.7)).toBe("42,70");
  });

  it("formats zero", () => {
    expect(formatAmount(0)).toBe("0,00");
  });
});

describe("getRowVisual", () => {
  it("marks transfers with info color and 'Transferência' label, no sign", () => {
    const tx = buildTx({
      transferId: "tr-1",
      transferToBoxId: "b2",
      description: "ignored",
    });
    const visual = getRowVisual(tx);
    expect(visual.isTransfer).toBe(true);
    expect(visual.color).toBe("var(--color-info)");
    expect(visual.label).toBe("Transferência");
    expect(visual.sign).toBe("");
  });

  it("uses success color and '+' sign for income", () => {
    const tx = buildTx({ type: "income", description: "Salário" });
    const visual = getRowVisual(tx);
    expect(visual.isTransfer).toBe(false);
    expect(visual.color).toBe("var(--color-success)");
    expect(visual.sign).toBe("+");
    expect(visual.label).toBe("Salário");
  });

  it("uses danger color and '−' sign for expense", () => {
    const tx = buildTx({ type: "expense", description: "Mercado" });
    const visual = getRowVisual(tx);
    expect(visual.isTransfer).toBe(false);
    expect(visual.color).toBe("var(--color-danger)");
    expect(visual.sign).toBe("−");
    expect(visual.label).toBe("Mercado");
  });

  it("falls back to '(Sem descrição)' when description is missing", () => {
    const tx = buildTx({ description: undefined });
    expect(getRowVisual(tx).label).toBe("(Sem descrição)");
  });

  it("falls back to '(Sem descrição)' when description is empty", () => {
    const tx = buildTx({ description: "" });
    expect(getRowVisual(tx).label).toBe("(Sem descrição)");
  });
});

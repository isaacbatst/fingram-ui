import { describe, it, expect } from "vitest";
import { DATA_COLORS, OWED_COLORS, getBoxColor } from "./box-colors";
import type { AllocationDTO } from "@/services/plan.service";

const alloc = (id: string, realizationMode: AllocationDTO["realizationMode"]): AllocationDTO => ({
  id, label: id, target: 0, monthlyAmount: [], realizationMode, estratoId: null, scheduledMovements: [],
});

describe("getBoxColor", () => {
  const allocations = [alloc("lote", "immediate"), alloc("reserva", "never"), alloc("obra", "immediate"), alloc("casamento", "onCompletion")];

  it("gives reserves DATA_COLORS after the one used by Disponível", () => {
    expect(getBoxColor(allocations, "reserva")).toBe(DATA_COLORS[1]);
    expect(getBoxColor(allocations, "casamento")).toBe(DATA_COLORS[2]);
  });

  it("gives payments OWED_COLORS in their own order, never a reserve color", () => {
    expect(getBoxColor(allocations, "lote")).toBe(OWED_COLORS[0]);
    expect(getBoxColor(allocations, "obra")).toBe(OWED_COLORS[1]);
    expect(DATA_COLORS).not.toContain(getBoxColor(allocations, "lote"));
  });
});

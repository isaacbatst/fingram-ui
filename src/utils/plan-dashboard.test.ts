import { describe, it, expect } from "vitest";
import {
  computeKpis,
  computeMilestones,
  computeCashStats,
  formatCompactCurrency,
  getActiveMonthlyAmount,
  buildMirrorRows,
} from "./plan-dashboard";
import type { MonthDataDTO, AllocationDTO, ChangePointDTO } from "@/services/plan.service";

function buildMonth(overrides: Partial<MonthDataDTO> & { month: number }): MonthDataDTO {
  return {
    date: "2026-01-01T00:00:00.000Z",
    isReal: false,
    income: 0,
    costOfLiving: 0,
    surplus: 0,
    cash: 0,
    allocations: {},
    allocationPayments: {},
    allocationYields: {},
    totalYield: 0,
    scheduledMovements: [],
    totalWealth: 0,
    totalCommitted: 0,
    financingDetails: {},
    allocationAccumulated: {},
    allocationRealized: {},
    realizedAllocations: [],
    ...overrides,
  };
}

describe("computeKpis", () => {
  it("should return last month values", () => {
    const projection: MonthDataDTO[] = [
      buildMonth({ month: 1, totalWealth: 10000, cash: 5000, totalCommitted: 3000 }),
      buildMonth({ month: 2, totalWealth: 20000, cash: 8000, totalCommitted: 6000 }),
    ];
    const boxes: AllocationDTO[] = [
      { id: "b1", label: "Terreno", target: 100000, monthlyAmount: [], realizationMode: 'immediate', estratoId: null, scheduledMovements: [] },
    ];
    const kpis = computeKpis(projection, boxes);
    expect(kpis.patrimonio.value).toBe(20000);
    expect(kpis.disponivel.value).toBe(8000);
    expect(kpis.comprometido.value).toBe(6000);
  });

  it("should compute delta from second-to-last month", () => {
    const projection: MonthDataDTO[] = [
      buildMonth({ month: 1, totalWealth: 10000, cash: 5000, totalCommitted: 3000 }),
      buildMonth({ month: 2, totalWealth: 13000, cash: 8000, totalCommitted: 6000 }),
    ];
    const kpis = computeKpis(projection, []);
    expect(kpis.patrimonio.delta).toBe(3000);
    expect(kpis.disponivel.delta).toBe(3000);
  });

  it("should compute comprometido percentage", () => {
    const projection: MonthDataDTO[] = [
      buildMonth({ month: 1, totalCommitted: 50000 }),
    ];
    const boxes: AllocationDTO[] = [
      { id: "b1", label: "Terreno", target: 100000, monthlyAmount: [], realizationMode: 'immediate', estratoId: null, scheduledMovements: [] },
    ];
    const kpis = computeKpis(projection, boxes);
    expect(kpis.comprometido.percent).toBe(50);
  });

  it("should exclude boxes without target from percentage", () => {
    const projection: MonthDataDTO[] = [
      buildMonth({ month: 1, totalCommitted: 50000 }),
    ];
    const boxes: AllocationDTO[] = [
      { id: "b1", label: "Terreno", target: 100000, monthlyAmount: [], realizationMode: 'immediate', estratoId: null, scheduledMovements: [] },
      { id: "b2", label: "Outro", target: 0, monthlyAmount: [], realizationMode: 'immediate', estratoId: null, scheduledMovements: [] },
    ];
    const kpis = computeKpis(projection, boxes);
    expect(kpis.comprometido.percent).toBe(50);
  });

  it("should return values for specified monthIndex", () => {
    const projection: MonthDataDTO[] = [
      buildMonth({ month: 1, totalWealth: 10000, cash: 5000, totalCommitted: 3000 }),
      buildMonth({ month: 2, totalWealth: 20000, cash: 8000, totalCommitted: 6000 }),
      buildMonth({ month: 3, totalWealth: 30000, cash: 12000, totalCommitted: 9000 }),
    ];
    const boxes: AllocationDTO[] = [];
    const kpis = computeKpis(projection, boxes, 1);
    expect(kpis.patrimonio.value).toBe(20000);
    expect(kpis.disponivel.value).toBe(8000);
    expect(kpis.comprometido.value).toBe(6000);
  });

  it("should return null delta when monthIndex is 0", () => {
    const projection: MonthDataDTO[] = [
      buildMonth({ month: 1, totalWealth: 10000, cash: 5000, totalCommitted: 3000 }),
      buildMonth({ month: 2, totalWealth: 20000, cash: 8000, totalCommitted: 6000 }),
    ];
    const kpis = computeKpis(projection, [], 0);
    expect(kpis.patrimonio.delta).toBeNull();
    expect(kpis.disponivel.delta).toBeNull();
    expect(kpis.comprometido.delta).toBeNull();
  });

  it("should compute delta from previous month when monthIndex > 0", () => {
    const projection: MonthDataDTO[] = [
      buildMonth({ month: 1, totalWealth: 10000, cash: 5000, totalCommitted: 3000 }),
      buildMonth({ month: 2, totalWealth: 13000, cash: 8000, totalCommitted: 6000 }),
      buildMonth({ month: 3, totalWealth: 18000, cash: 12000, totalCommitted: 9000 }),
    ];
    const kpis = computeKpis(projection, [], 2);
    expect(kpis.patrimonio.delta).toBe(5000);
    expect(kpis.disponivel.delta).toBe(4000);
  });
});

describe("computeMilestones", () => {
  it("should find month where box reaches target", () => {
    const projection: MonthDataDTO[] = [
      buildMonth({ month: 1, allocations: { b1: 5000 } }),
      buildMonth({ month: 2, allocations: { b1: 10000 } }),
      buildMonth({ month: 3, allocations: { b1: 15000 } }),
    ];
    const boxes: AllocationDTO[] = [
      { id: "b1", label: "Casamento", target: 10000, monthlyAmount: [], realizationMode: 'manual', estratoId: null, scheduledMovements: [] },
    ];
    const milestones = computeMilestones(projection, boxes);
    expect(milestones).toEqual([{ month: 2, label: "Casamento", boxId: "b1" }]);
  });

  it("should skip boxes with target 0", () => {
    const projection: MonthDataDTO[] = [
      buildMonth({ month: 1, allocations: { b1: 5000 } }),
    ];
    const boxes: AllocationDTO[] = [
      { id: "b1", label: "Ações", target: 0, monthlyAmount: [], realizationMode: 'manual', estratoId: null, scheduledMovements: [] },
    ];
    const milestones = computeMilestones(projection, boxes);
    expect(milestones).toEqual([]);
  });
});

describe("computeCashStats", () => {
  it("should compute average surplus", () => {
    const projection: MonthDataDTO[] = [
      buildMonth({ month: 1, surplus: 1000, cash: 1000 }),
      buildMonth({ month: 2, surplus: 2000, cash: 3000 }),
      buildMonth({ month: 3, surplus: 3000, cash: 6000 }),
    ];
    const stats = computeCashStats(projection);
    expect(stats.currentCash).toBe(6000);
    expect(stats.averageSurplus).toBe(2000);
  });

  it("should compute stats up to specified monthIndex", () => {
    const projection: MonthDataDTO[] = [
      buildMonth({ month: 1, surplus: 1000, cash: 1000 }),
      buildMonth({ month: 2, surplus: 2000, cash: 3000 }),
      buildMonth({ month: 3, surplus: 3000, cash: 6000 }),
    ];
    const stats = computeCashStats(projection, 1);
    expect(stats.currentCash).toBe(3000);
    expect(stats.averageSurplus).toBe(1500);
  });

  it("should return single month stats when monthIndex is 0", () => {
    const projection: MonthDataDTO[] = [
      buildMonth({ month: 1, surplus: 1000, cash: 1000 }),
      buildMonth({ month: 2, surplus: 2000, cash: 3000 }),
    ];
    const stats = computeCashStats(projection, 0);
    expect(stats.currentCash).toBe(1000);
    expect(stats.averageSurplus).toBe(1000);
  });
});

describe("formatCompactCurrency", () => {
  it("should format thousands as k", () => {
    expect(formatCompactCurrency(42300)).toBe("42.3k");
  });

  it("should format exact thousands", () => {
    expect(formatCompactCurrency(88000)).toBe("88k");
  });

  it("should format values under 1000", () => {
    expect(formatCompactCurrency(500)).toBe("500");
  });
});

describe("getActiveMonthlyAmount", () => {
  it("should return the last change point before or at given month", () => {
    const changePoints: ChangePointDTO[] = [
      { month: 0, amount: 1000 },
      { month: 10, amount: 2000 },
    ];
    expect(getActiveMonthlyAmount(changePoints, 5)).toBe(1000);
    expect(getActiveMonthlyAmount(changePoints, 10)).toBe(2000);
    expect(getActiveMonthlyAmount(changePoints, 15)).toBe(2000);
  });
});

describe("buildMirrorRows", () => {
  const alloc = (overrides: Partial<AllocationDTO> & { id: string }): AllocationDTO => ({
    label: overrides.id,
    target: 0,
    monthlyAmount: [],
    realizationMode: 'never',
    estratoId: null,
    scheduledMovements: [],
    ...overrides,
  });

  it("stacks cash and held funds above zero and nets the balance", () => {
    const reserva = alloc({ id: "r1", realizationMode: 'never' });
    const [row] = buildMirrorRows(
      [buildMonth({ month: 0, cash: 5000, allocations: { r1: 20000 } })],
      [reserva],
    );
    expect(row.cash).toBe(5000);
    expect(row.held).toEqual({ r1: 20000 });
    expect(row.owed).toEqual({});
    expect(row.heldTotal).toBe(25000);
    expect(row.owedTotal).toBe(0);
    expect(row.balance).toBe(25000);
  });

  it("moves negative cash below zero as deficit", () => {
    const [row] = buildMirrorRows(
      [buildMonth({ month: 0, cash: -3000, allocations: { r1: 10000 } })],
      [alloc({ id: "r1", realizationMode: 'manual' })],
    );
    expect(row.heldTotal).toBe(10000);
    expect(row.owedTotal).toBe(3000);
    expect(row.balance).toBe(7000);
  });

  it("owes target minus accumulated for a payment once it has started", () => {
    const lote = alloc({ id: "p1", realizationMode: 'immediate', target: 100000 });
    const rows = buildMirrorRows(
      [
        buildMonth({ month: 0, allocationAccumulated: { p1: 0 }, allocations: { p1: 0 } }),
        buildMonth({ month: 1, allocationAccumulated: { p1: 10000 }, allocations: { p1: 10000 } }),
        buildMonth({ month: 2, allocationAccumulated: { p1: 100000 }, allocations: { p1: 100000 } }),
      ],
      [lote],
    );
    expect(rows.map((r) => r.owed.p1)).toEqual([0, 90000, 0]);
    expect(rows[1].held).toEqual({});
    expect(rows[1].balance).toBe(-90000);
  });

  it("owes the outstanding balance of a financing, nothing before it starts", () => {
    const obra = alloc({
      id: "f1",
      realizationMode: 'immediate',
      target: 500000,
      financing: { principal: 500000, annualRate: 0.12, termMonths: 360, system: "sac" },
    });
    const rows = buildMirrorRows(
      [
        buildMonth({ month: 0 }),
        buildMonth({
          month: 1,
          allocationAccumulated: { f1: 1000 },
          financingDetails: { f1: { payment: 6000, amortization: 1000, interest: 5000, outstandingBalance: 499000, phase: "amortization" } },
        }),
      ],
      [obra],
    );
    expect(rows.map((r) => r.owed.f1)).toEqual([0, 499000]);
  });

  it("ignores payments without a target", () => {
    const [row] = buildMirrorRows(
      [buildMonth({ month: 0, allocationAccumulated: { p1: 500 } })],
      [alloc({ id: "p1", realizationMode: 'immediate', target: 0 })],
    );
    expect(row.owed).toEqual({ p1: 0 });
    expect(row.owedTotal).toBe(0);
  });
});

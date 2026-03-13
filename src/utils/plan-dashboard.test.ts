import { describe, it, expect } from "vitest";
import {
  computeKpis,
  computeMilestones,
  computeCashStats,
  formatCompactCurrency,
  getActiveMonthlyAmount,
} from "./plan-dashboard";
import type { MonthDataDTO, BoxDTO, ChangePointDTO } from "@/services/plan.service";

function buildMonth(overrides: Partial<MonthDataDTO> & { month: number }): MonthDataDTO {
  return {
    date: "2026-01-01T00:00:00.000Z",
    income: 0,
    costOfLiving: 0,
    surplus: 0,
    cash: 0,
    boxes: {},
    boxPayments: {},
    boxYields: {},
    totalYield: 0,
    scheduledPayments: [],
    totalWealth: 0,
    totalCommitted: 0,
    financingDetails: {},
    ...overrides,
  };
}

describe("computeKpis", () => {
  it("should return last month values", () => {
    const projection: MonthDataDTO[] = [
      buildMonth({ month: 1, totalWealth: 10000, cash: 5000, totalCommitted: 3000 }),
      buildMonth({ month: 2, totalWealth: 20000, cash: 8000, totalCommitted: 6000 }),
    ];
    const boxes: BoxDTO[] = [
      { id: "b1", label: "Terreno", target: 100000, monthlyAmount: [], holdsFunds: false, scheduledPayments: [] },
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
    const boxes: BoxDTO[] = [
      { id: "b1", label: "Terreno", target: 100000, monthlyAmount: [], holdsFunds: false, scheduledPayments: [] },
    ];
    const kpis = computeKpis(projection, boxes);
    expect(kpis.comprometido.percent).toBe(50);
  });

  it("should exclude boxes without target from percentage", () => {
    const projection: MonthDataDTO[] = [
      buildMonth({ month: 1, totalCommitted: 50000 }),
    ];
    const boxes: BoxDTO[] = [
      { id: "b1", label: "Terreno", target: 100000, monthlyAmount: [], holdsFunds: false, scheduledPayments: [] },
      { id: "b2", label: "Outro", target: 0, monthlyAmount: [], holdsFunds: false, scheduledPayments: [] },
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
    const boxes: BoxDTO[] = [];
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
      buildMonth({ month: 1, boxes: { b1: 5000 } }),
      buildMonth({ month: 2, boxes: { b1: 10000 } }),
      buildMonth({ month: 3, boxes: { b1: 15000 } }),
    ];
    const boxes: BoxDTO[] = [
      { id: "b1", label: "Casamento", target: 10000, monthlyAmount: [], holdsFunds: true, scheduledPayments: [] },
    ];
    const milestones = computeMilestones(projection, boxes);
    expect(milestones).toEqual([{ month: 2, label: "Casamento", boxId: "b1" }]);
  });

  it("should skip boxes with target 0", () => {
    const projection: MonthDataDTO[] = [
      buildMonth({ month: 1, boxes: { b1: 5000 } }),
    ];
    const boxes: BoxDTO[] = [
      { id: "b1", label: "Ações", target: 0, monthlyAmount: [], holdsFunds: true, scheduledPayments: [] },
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

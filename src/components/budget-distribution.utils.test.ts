import { describe, expect, it } from "vitest";
import {
  buildDistribution,
  DISTRIBUTION_COLORS,
  OTHERS_COLOR,
} from "./budget-distribution.utils";

const item = (id: string, valor: number, usado: number) => ({
  categoryId: id,
  categoria: id.toUpperCase(),
  valor,
  usado,
});

describe("buildDistribution", () => {
  it("computes each category's share of planned and of executed", () => {
    const d = buildDistribution([item("a", 300, 100), item("b", 100, 300)]);

    expect(d.totalPlanned).toBe(400);
    expect(d.totalExecuted).toBe(400);
    expect(d.slices.map((s) => [s.key, s.plannedShare, s.executedShare])).toEqual([
      ["a", 0.75, 0.25],
      ["b", 0.25, 0.75],
    ]);
  });

  it("orders slices by planned amount, largest first", () => {
    const d = buildDistribution([item("a", 100, 0), item("b", 500, 0), item("c", 300, 0)]);
    expect(d.slices.map((s) => s.key)).toEqual(["b", "c", "a"]);
  });

  it("keeps every category when there are six or fewer", () => {
    const items = ["a", "b", "c", "d", "e", "f"].map((id, i) => item(id, 100 + i, 0));
    const d = buildDistribution(items);
    expect(d.slices).toHaveLength(6);
    expect(d.slices.some((s) => s.categoryId === null)).toBe(false);
  });

  it("folds the rest into 'Outras' past six, summing their amounts", () => {
    const items = [
      item("a", 600, 100),
      item("b", 500, 100),
      item("c", 400, 100),
      item("d", 300, 100),
      item("e", 200, 100),
      item("f", 20, 5),
      item("g", 10, 7),
    ];
    const d = buildDistribution(items);

    expect(d.slices.map((s) => s.key)).toEqual(["a", "b", "c", "d", "e", "outras"]);
    const others = d.slices[5];
    expect(others).toMatchObject({ categoryId: null, label: "Outras", planned: 30, executed: 12 });
    expect(others.color).toBe(OTHERS_COLOR);
    expect(others.count).toBe(2);
  });

  it("does not hide a small-plan category that took a big share of spending", () => {
    const items = [
      item("a", 600, 0),
      item("b", 500, 0),
      item("c", 400, 0),
      item("d", 300, 0),
      item("e", 200, 0),
      item("f", 150, 0),
      item("lazer", 10, 900),
    ];
    const d = buildDistribution(items);
    const keys = d.slices.map((s) => s.key);

    expect(keys).toContain("lazer");
    // Still ordered by plan: the overspent category sits last among the named ones.
    expect(keys).toEqual(["a", "b", "c", "d", "lazer", "outras"]);
  });

  it("colors named slices in fixed order, so both rings share each category's color", () => {
    const d = buildDistribution([item("a", 300, 0), item("b", 200, 0), item("c", 100, 0)]);
    expect(d.slices.map((s) => s.color)).toEqual(DISTRIBUTION_COLORS.slice(0, 3));
  });

  it("reports zero shares instead of NaN when nothing was spent yet", () => {
    const d = buildDistribution([item("a", 300, 0), item("b", 100, 0)]);
    expect(d.totalExecuted).toBe(0);
    expect(d.slices.map((s) => s.executedShare)).toEqual([0, 0]);
  });

  it("returns no slices for an empty budget", () => {
    expect(buildDistribution([])).toEqual({ slices: [], totalPlanned: 0, totalExecuted: 0 });
  });
});

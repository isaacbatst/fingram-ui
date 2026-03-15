import type { MonthDataDTO, AllocationDTO, ChangePointDTO } from "@/services/plan.service";

export interface KpiData {
  value: number;
  delta: number | null;
}

export interface KpiSet {
  patrimonio: KpiData;
  disponivel: KpiData;
  comprometido: KpiData & { percent: number | null };
}

export function computeKpis(
  projection: MonthDataDTO[],
  allocations: AllocationDTO[],
  monthIndex?: number,
): KpiSet {
  const idx = monthIndex ?? projection.length - 1;
  const current = projection[idx];
  const prev = idx > 0 ? projection[idx - 1] : null;

  const targetSum = allocations
    .filter((b) => !b.holdsFunds && b.target > 0)
    .reduce((sum, b) => sum + b.target, 0);

  return {
    patrimonio: {
      value: current?.totalWealth ?? 0,
      delta: prev ? (current?.totalWealth ?? 0) - prev.totalWealth : null,
    },
    disponivel: {
      value: current?.cash ?? 0,
      delta: prev ? (current?.cash ?? 0) - prev.cash : null,
    },
    comprometido: {
      value: current?.totalCommitted ?? 0,
      delta: prev ? (current?.totalCommitted ?? 0) - prev.totalCommitted : null,
      percent: targetSum > 0 ? Math.round(((current?.totalCommitted ?? 0) / targetSum) * 100) : null,
    },
  };
}

export interface DerivedMilestone {
  month: number;
  label: string;
  boxId: string;
}

export function computeMilestones(projection: MonthDataDTO[], allocations: AllocationDTO[]): DerivedMilestone[] {
  const milestones: DerivedMilestone[] = [];
  for (const allocation of allocations) {
    if (allocation.target <= 0) continue;
    for (const monthData of projection) {
      const balance = monthData.allocations[allocation.id] ?? 0;
      if (balance >= allocation.target) {
        milestones.push({ month: monthData.month, label: allocation.label, boxId: allocation.id });
        break;
      }
    }
  }
  return milestones;
}

export interface CashStats {
  currentCash: number;
  averageSurplus: number;
}

export function computeCashStats(
  projection: MonthDataDTO[],
  monthIndex?: number,
): CashStats {
  if (projection.length === 0) return { currentCash: 0, averageSurplus: 0 };
  const idx = monthIndex ?? projection.length - 1;
  const slice = projection.slice(0, idx + 1);
  const totalSurplus = slice.reduce((sum, m) => sum + m.surplus, 0);
  return {
    currentCash: projection[idx].cash,
    averageSurplus: Math.round(totalSurplus / slice.length),
  };
}

export function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs < 1000) return String(Math.round(abs));
  const k = abs / 1000;
  const formatted = k % 1 === 0 ? `${k}k` : `${k.toFixed(1).replace(/\.0$/, "")}k`;
  return value < 0 ? `-${formatted}` : formatted;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function formatMonthYear(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function getActiveMonthlyAmount(changePoints: ChangePointDTO[], month: number): number {
  let active = 0;
  for (const cp of changePoints) {
    if (cp.month <= month) active = cp.amount;
    else break;
  }
  return active;
}

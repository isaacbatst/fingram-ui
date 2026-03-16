import type { MonthDataDTO, AllocationDTO, ChangePointDTO } from "@/services/plan.service";

export const holdsPhysicalFunds = (a: { realizationMode: string }) => a.realizationMode !== 'immediate';

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
    .filter((b) => b.realizationMode === 'immediate' && b.target > 0)
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
      const accumulated = monthData.allocationAccumulated?.[allocation.id] ?? monthData.allocations[allocation.id] ?? 0;
      if (accumulated >= allocation.target) {
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

export interface CompositionItem {
  id: string;
  label: string;
  value: number;
  color: string;
  percent: number;
}

export interface PatrimonioData {
  total: number;
  delta: number | null;
  items: CompositionItem[];
}

export interface ComprometidoItem {
  id: string;
  label: string;
  value: number;
  target: number;
  progress: number;
  color: string;
}

export interface ComprometidoData {
  total: number;
  delta: number | null;
  percentPaid: number | null;
  items: ComprometidoItem[];
}

export function computePatrimonio(
  projection: MonthDataDTO[],
  allocations: AllocationDTO[],
  monthIndex: number,
  getColor: (allocationId: string) => string,
): PatrimonioData {
  const current = projection[monthIndex];
  const prev = monthIndex > 0 ? projection[monthIndex - 1] : null;
  const total = current?.totalWealth ?? 0;

  const items: CompositionItem[] = [];

  // Disponível (cash) first
  const cash = current?.cash ?? 0;
  items.push({
    id: '__cash__',
    label: 'Disponível',
    value: cash,
    color: 'var(--color-data-1)',
    percent: total > 0 ? Math.round((cash / total) * 100) : 0,
  });

  // non-immediate allocations that still hold physical funds (exclude realized onCompletion)
  for (const alloc of allocations) {
    if (!holdsPhysicalFunds(alloc)) continue;
    const balance = current?.allocations[alloc.id] ?? 0;
    const accumulated = current?.allocationAccumulated?.[alloc.id] ?? balance;
    const isRealized = alloc.realizationMode === 'onCompletion'
      && alloc.target > 0
      && accumulated >= alloc.target;
    // Realized onCompletion → moves to Comprometido card
    if (isRealized) continue;
    items.push({
      id: alloc.id,
      label: alloc.label,
      value: balance,
      color: getColor(alloc.id),
      percent: total > 0 ? Math.round((balance / total) * 100) : 0,
    });
  }

  return {
    total,
    delta: prev ? total - prev.totalWealth : null,
    items,
  };
}

export function computeComprometido(
  projection: MonthDataDTO[],
  allocations: AllocationDTO[],
  monthIndex: number,
  getColor: (allocationId: string) => string,
): ComprometidoData {
  const current = projection[monthIndex];
  const prev = monthIndex > 0 ? projection[monthIndex - 1] : null;
  const total = current?.totalCommitted ?? 0;

  // Include immediate + realized onCompletion in target sum
  const targetSum = allocations
    .filter((b) => {
      if (b.target <= 0) return false;
      if (b.realizationMode === 'immediate') return true;
      if (b.realizationMode === 'onCompletion') {
        const acc = current?.allocationAccumulated?.[b.id] ?? 0;
        return acc >= b.target;
      }
      return false;
    })
    .reduce((sum, b) => sum + b.target, 0);

  const items: ComprometidoItem[] = [];
  for (const alloc of allocations) {
    const balance = current?.allocations[alloc.id] ?? 0;
    const accumulated = current?.allocationAccumulated?.[alloc.id] ?? balance;

    if (alloc.realizationMode === 'immediate') {
      // Pagamento: always in Comprometido
      items.push({
        id: alloc.id,
        label: alloc.label,
        value: balance,
        target: alloc.target,
        progress: alloc.target > 0 ? Math.min(100, (balance / alloc.target) * 100) : 0,
        color: getColor(alloc.id),
      });
    } else if (
      alloc.realizationMode === 'onCompletion'
      && alloc.target > 0
      && accumulated >= alloc.target
    ) {
      // onCompletion realized: moves from Patrimônio to Comprometido
      items.push({
        id: alloc.id,
        label: alloc.label,
        value: accumulated,
        target: alloc.target,
        progress: 100,
        color: getColor(alloc.id),
      });
    }
  }

  return {
    total,
    delta: prev ? total - prev.totalCommitted : null,
    percentPaid: targetSum > 0 ? Math.round((total / targetSum) * 100) : null,
    items,
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

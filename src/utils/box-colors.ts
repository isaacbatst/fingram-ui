import type { AllocationDTO } from "@/services/plan.service";

export const DATA_COLORS = [
  "var(--color-data-1)",
  "var(--color-data-2)",
  "var(--color-data-4)",
  "var(--color-data-3)",
  "var(--color-data-5)",
];

export const OWED_COLORS = [
  "var(--color-owed-1)",
  "var(--color-owed-2)",
  "var(--color-owed-3)",
];

/**
 * Returns the color assigned to an allocation, matching the chart series order.
 * Non-immediate (holds physical funds) allocations get DATA_COLORS[1..N] (index 0 is "Disponível").
 * Immediate (Pagamento) allocations get OWED_COLORS, so they never share a Reserva's color.
 */
export function getBoxColor(allocations: AllocationDTO[], allocationId: string): string {
  const physicalAllocations = allocations.filter((b) => b.realizationMode !== 'immediate');
  const idx = physicalAllocations.findIndex((b) => b.id === allocationId);
  if (idx >= 0) return DATA_COLORS[(idx + 1) % DATA_COLORS.length];
  const payments = allocations.filter((b) => b.realizationMode === 'immediate');
  const paymentIdx = payments.findIndex((b) => b.id === allocationId);
  return OWED_COLORS[Math.max(0, paymentIdx) % OWED_COLORS.length];
}

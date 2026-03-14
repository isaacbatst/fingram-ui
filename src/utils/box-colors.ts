import type { BoxDTO } from "@/services/plan.service";

export const DATA_COLORS = [
  "var(--color-data-1)",
  "var(--color-data-2)",
  "var(--color-data-4)",
  "var(--color-data-3)",
  "var(--color-data-5)",
];

const NON_HOLDS_COLOR = "var(--color-info)";

/**
 * Returns the color assigned to a box, matching the chart series order.
 * holdsFunds boxes get DATA_COLORS[1..N] (index 0 is "Disponível").
 * Non-holdsFunds boxes get the info color.
 */
export function getBoxColor(boxes: BoxDTO[], boxId: string): string {
  const holdsFundsBoxes = boxes.filter((b) => b.holdsFunds);
  const idx = holdsFundsBoxes.findIndex((b) => b.id === boxId);
  if (idx < 0) return NON_HOLDS_COLOR;
  return DATA_COLORS[(idx + 1) % DATA_COLORS.length];
}

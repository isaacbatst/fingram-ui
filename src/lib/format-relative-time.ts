const WEEKDAYS_PT = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as const;

const startOfLocalDay = (date: Date): Date => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export function formatRelativeTime(
  input: Date | string | number,
  now: Date = new Date(),
): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 60 * 1000) return "agora";

  const dayDiff = Math.floor(
    (startOfLocalDay(now).getTime() - startOfLocalDay(date).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  if (dayDiff === 0) {
    const diffMin = Math.floor(diffMs / (60 * 1000));
    if (diffMin < 60) return `${diffMin}m`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours}h`;
  }

  if (dayDiff === 1) return "ontem";
  if (dayDiff < 7) return WEEKDAYS_PT[date.getDay()];

  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

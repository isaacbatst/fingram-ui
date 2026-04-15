// SYNC: Keep in sync with fingram-bot/src/vault/domain/budget-period.ts

export type BudgetStartDayOverride = {
  year: number;
  month: number; // 1-12
  day: number; // 1-28
};

export type BudgetStartDaySchedule = {
  defaultDay: number; // 1-28
  overrides: BudgetStartDayOverride[];
};

export function getEffectiveStartDay(
  schedule: BudgetStartDaySchedule,
  year: number,
  month: number,
): number {
  const override = schedule.overrides.find(
    (o) => o.year === year && o.month === month,
  );
  return override ? override.day : schedule.defaultDay;
}

export function getBudgetPeriod(
  schedule: BudgetStartDaySchedule,
  year: number,
  month: number,
): { startDate: Date; endDate: Date } {
  const startDay = getEffectiveStartDay(schedule, year, month);
  const startDate = new Date(Date.UTC(year, month - 1, startDay));

  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextStartDay = getEffectiveStartDay(schedule, nextYear, nextMonth);

  const endDate = new Date(
    Date.UTC(nextYear, nextMonth - 1, nextStartDay - 1, 23, 59, 59, 999),
  );

  return { startDate, endDate };
}

export function getCurrentBudgetPeriod(
  schedule: BudgetStartDaySchedule,
  now: Date = new Date(),
): { month: number; year: number } {
  const candidateYear = now.getUTCFullYear();
  const candidateMonth = now.getUTCMonth() + 1;

  const { startDate } = getBudgetPeriod(
    schedule,
    candidateYear,
    candidateMonth,
  );
  if (now.getTime() >= startDate.getTime()) {
    return { year: candidateYear, month: candidateMonth };
  }

  if (candidateMonth === 1) {
    return { year: candidateYear - 1, month: 12 };
  }
  return { year: candidateYear, month: candidateMonth - 1 };
}

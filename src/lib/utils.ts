import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns the current budget period's month/year based on the configured start day.
 * If today is before the start day, we're still in the previous month's budget period.
 */
export function getCurrentBudgetPeriod(budgetStartDay: number): { month: number; year: number } {
  const now = new Date();
  let month = now.getMonth() + 1;
  let year = now.getFullYear();

  if (now.getDate() < budgetStartDay) {
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
  }

  return { month, year };
}

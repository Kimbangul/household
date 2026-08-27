import { isPastPeriod } from './period';
import { getExpensesInPeriod, sumExpenseAmounts } from './periodExpenses';
import type { Expense, Period } from './types';

export interface PeriodComparison {
  latest: Period;
  previous: Period;
  latestTotal: number;
  previousTotal: number;
  difference: number;
}

// Most-recently-ended first; ties (same endDate) fall back to the later
// startDate, so a shorter period that ended on the same day as a longer one
// is treated as the more recent of the two.
function byMostRecentlyEnded(a: Period, b: Period): number {
  if (a.endDate !== b.endDate) {
    return a.endDate < b.endDate ? 1 : -1;
  }
  return a.startDate < b.startDate ? 1 : a.startDate > b.startDate ? -1 : 0;
}

// Periods in this app are free-form, independently-defined date-range views
// that are allowed to overlap and can represent completely different scopes
// (e.g. "이번 주" and "이번 달" open at once — see docs/adr/0001). Comparing
// "the two most recently ended periods" can therefore pair periods of
// unrelated scope/duration if the user happens to have such periods open;
// this function implements the literal ticket spec (#10) as written and
// doesn't attempt to detect or exclude that case.
export function compareRecentPeriods(periods: Period[], expenses: Expense[], today: string): PeriodComparison | null {
  const endedPeriods = periods.filter((period) => isPastPeriod(period, today));
  if (endedPeriods.length < 2) {
    return null;
  }

  const [latest, previous] = [...endedPeriods].sort(byMostRecentlyEnded);

  const latestTotal = sumExpenseAmounts(getExpensesInPeriod(expenses, latest));
  const previousTotal = sumExpenseAmounts(getExpensesInPeriod(expenses, previous));

  return { latest, previous, latestTotal, previousTotal, difference: latestTotal - previousTotal };
}

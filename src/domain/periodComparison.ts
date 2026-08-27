import { isFuturePeriod } from './period';
import { getRecordsInPeriod, sumAmounts } from './periodRecords';
import type { Expense, Period } from './types';

export interface PeriodComparison {
  latest: Period;
  previous: Period;
  latestTotal: number;
  previousTotal: number;
  difference: number;
}

// Latest endDate first (not necessarily "ended" — an eligible period may
// still be in progress). Ties (same endDate) fall back to the later
// startDate, so a shorter period ending the same day as a longer one is
// treated as the more recent of the two.
function byLatestEndDate(a: Period, b: Period): number {
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
// this function doesn't attempt to detect or exclude that case.
//
// An in-progress period (already started, not yet ended) is eligible too —
// only periods that haven't started yet are excluded. A currently-open
// period's total is "so far", not final, but users expect to see how the
// current period compares to the last one before it has even ended.
export function compareRecentPeriods(periods: Period[], expenses: Expense[], today: string): PeriodComparison | null {
  const eligiblePeriods = periods.filter((period) => !isFuturePeriod(period, today));
  if (eligiblePeriods.length < 2) {
    return null;
  }

  const [latest, previous] = [...eligiblePeriods].sort(byLatestEndDate);

  const latestTotal = sumAmounts(getRecordsInPeriod(expenses, latest));
  const previousTotal = sumAmounts(getRecordsInPeriod(expenses, previous));

  return { latest, previous, latestTotal, previousTotal, difference: latestTotal - previousTotal };
}

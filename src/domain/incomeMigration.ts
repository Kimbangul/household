import type { IncomeEntry } from './types';

// Shape of a period as it existed on disk before income entries: a single
// summary number stored directly on the period, rather than derived from
// itemized entries. `income` is optional/absent once a period has already
// been migrated.
export interface PeriodWithLegacyIncome {
  id: string;
  startDate: string;
  endDate: string;
  income?: number;
}

export function migrateLegacyPeriodIncome(periods: PeriodWithLegacyIncome[]): IncomeEntry[] {
  return periods
    .filter((period) => typeof period.income === 'number' && period.income > 0)
    .map((period) => ({
      // Derived from the period's own id rather than a fresh generated one,
      // so this function stays pure/deterministic and naturally idempotent:
      // re-running it against the same period always yields the same entry id.
      id: `${period.id}-legacy-income`,
      date: period.startDate,
      item: '이전 수입',
      amount: period.income as number,
    }));
}

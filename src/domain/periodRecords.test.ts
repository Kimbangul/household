import { getRecordsInPeriod, sumAmounts } from './periodRecords';
import type { Expense, IncomeEntry, Period } from './types';

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: 'e1',
    date: '2026-08-15',
    item: '점심',
    amount: 10000,
    categoryId: 'default-food',
    ...overrides,
  };
}

function incomeEntry(overrides: Partial<IncomeEntry>): IncomeEntry {
  return {
    id: 'i1',
    date: '2026-08-15',
    item: '8월 급여',
    amount: 3000000,
    ...overrides,
  };
}

const period: Period = { id: 'p1', startDate: '2026-08-01', endDate: '2026-08-31' };

describe('getRecordsInPeriod', () => {
  test('includes an expense dated inside the range', () => {
    const inRange = expense({ id: 'e1', date: '2026-08-15' });
    expect(getRecordsInPeriod([inRange], period)).toEqual([inRange]);
  });

  test('includes records dated exactly on the start or end date (inclusive boundaries)', () => {
    const onStart = expense({ id: 'e1', date: '2026-08-01' });
    const onEnd = expense({ id: 'e2', date: '2026-08-31' });
    expect(getRecordsInPeriod([onStart, onEnd], period)).toEqual([onStart, onEnd]);
  });

  test('excludes an out-of-period record dated before the range', () => {
    const before = expense({ id: 'e1', date: '2026-07-31' });
    expect(getRecordsInPeriod([before], period)).toEqual([]);
  });

  test('excludes an out-of-period record dated after the range', () => {
    const after = expense({ id: 'e1', date: '2026-09-01' });
    expect(getRecordsInPeriod([after], period)).toEqual([]);
  });

  test('includes the same record for two overlapping periods', () => {
    const shared = expense({ id: 'e1', date: '2026-08-20' });
    const periodA: Period = { id: 'pa', startDate: '2026-08-01', endDate: '2026-08-25' };
    const periodB: Period = { id: 'pb', startDate: '2026-08-15', endDate: '2026-08-31' };

    expect(getRecordsInPeriod([shared], periodA)).toEqual([shared]);
    expect(getRecordsInPeriod([shared], periodB)).toEqual([shared]);
  });

  test('also works for income entries, not just expenses', () => {
    const inRange = incomeEntry({ id: 'i1', date: '2026-08-15' });
    const outOfRange = incomeEntry({ id: 'i2', date: '2026-09-01' });
    expect(getRecordsInPeriod([inRange, outOfRange], period)).toEqual([inRange]);
  });
});

describe('sumAmounts', () => {
  test('sums the amounts of the given expenses', () => {
    const expenses = [expense({ id: 'e1', amount: 10000 }), expense({ id: 'e2', amount: 5000 })];
    expect(sumAmounts(expenses)).toBe(15000);
  });

  test('sums the amounts of the given income entries', () => {
    const entries = [incomeEntry({ id: 'i1', amount: 3000000 }), incomeEntry({ id: 'i2', amount: 200000 })];
    expect(sumAmounts(entries)).toBe(3200000);
  });

  test('returns 0 for an empty list', () => {
    expect(sumAmounts([])).toBe(0);
  });
});

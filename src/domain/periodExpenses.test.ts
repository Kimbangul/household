import { getExpensesInPeriod, sumExpenseAmounts } from './periodExpenses';
import type { Expense, Period } from './types';

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

const period: Period = { id: 'p1', startDate: '2026-08-01', endDate: '2026-08-31', income: 0 };

describe('getExpensesInPeriod', () => {
  test('includes an expense dated inside the range', () => {
    const inRange = expense({ id: 'e1', date: '2026-08-15' });
    expect(getExpensesInPeriod([inRange], period)).toEqual([inRange]);
  });

  test('includes expenses dated exactly on the start or end date (inclusive boundaries)', () => {
    const onStart = expense({ id: 'e1', date: '2026-08-01' });
    const onEnd = expense({ id: 'e2', date: '2026-08-31' });
    expect(getExpensesInPeriod([onStart, onEnd], period)).toEqual([onStart, onEnd]);
  });

  test('excludes an out-of-period expense dated before the range', () => {
    const before = expense({ id: 'e1', date: '2026-07-31' });
    expect(getExpensesInPeriod([before], period)).toEqual([]);
  });

  test('excludes an out-of-period expense dated after the range', () => {
    const after = expense({ id: 'e1', date: '2026-09-01' });
    expect(getExpensesInPeriod([after], period)).toEqual([]);
  });

  test('includes the same expense for two overlapping periods', () => {
    const shared = expense({ id: 'e1', date: '2026-08-20' });
    const periodA: Period = { id: 'pa', startDate: '2026-08-01', endDate: '2026-08-25', income: 0 };
    const periodB: Period = { id: 'pb', startDate: '2026-08-15', endDate: '2026-08-31', income: 0 };

    expect(getExpensesInPeriod([shared], periodA)).toEqual([shared]);
    expect(getExpensesInPeriod([shared], periodB)).toEqual([shared]);
  });
});

describe('sumExpenseAmounts', () => {
  test('sums the amounts of the given expenses', () => {
    const expenses = [expense({ id: 'e1', amount: 10000 }), expense({ id: 'e2', amount: 5000 })];
    expect(sumExpenseAmounts(expenses)).toBe(15000);
  });

  test('returns 0 for an empty list', () => {
    expect(sumExpenseAmounts([])).toBe(0);
  });
});

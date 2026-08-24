import { getRecentExpenses } from './recentExpenses';
import type { Expense } from './types';

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: 'expense-1',
    date: '2026-08-24',
    item: '점심',
    amount: 10000,
    categoryId: 'default-food',
    ...overrides,
  };
}

test('sorts expenses by date, most recent first', () => {
  const older = expense({ id: 'e1', date: '2026-08-20' });
  const newer = expense({ id: 'e2', date: '2026-08-24' });
  const middle = expense({ id: 'e3', date: '2026-08-22' });

  expect(getRecentExpenses([older, newer, middle])).toEqual([newer, middle, older]);
});

test('breaks ties on the same date by putting the later-inserted expense first', () => {
  const first = expense({ id: 'e1', date: '2026-08-24' });
  const second = expense({ id: 'e2', date: '2026-08-24' });

  expect(getRecentExpenses([first, second])).toEqual([second, first]);
});

test('includes an out-of-period expense just like any other expense', () => {
  const outOfPeriod = expense({ id: 'e1', date: '2020-01-01' });

  expect(getRecentExpenses([outOfPeriod])).toEqual([outOfPeriod]);
});

test('limits the result when a limit is given', () => {
  const expenses = [
    expense({ id: 'e1', date: '2026-08-20' }),
    expense({ id: 'e2', date: '2026-08-21' }),
    expense({ id: 'e3', date: '2026-08-22' }),
  ];

  expect(getRecentExpenses(expenses, 2)).toEqual([expenses[2], expenses[1]]);
});

test('returns an empty list when there are no expenses', () => {
  expect(getRecentExpenses([])).toEqual([]);
});

test('does not mutate the input array', () => {
  const expenses = [expense({ id: 'e1', date: '2026-08-20' }), expense({ id: 'e2', date: '2026-08-24' })];
  const copy = [...expenses];

  getRecentExpenses(expenses);

  expect(expenses).toEqual(copy);
});

import { aggregateExpensesByCategory } from './categoryStats';
import type { Expense } from './types';

function expense(overrides: Partial<Expense>): Expense {
  return {
    id: 'e1',
    date: '2026-08-01',
    item: '테스트',
    amount: 1000,
    categoryId: 'cat-1',
    ...overrides,
  };
}

describe('aggregateExpensesByCategory', () => {
  test('returns an empty array for no expenses', () => {
    expect(aggregateExpensesByCategory([], {})).toEqual([]);
  });

  test('groups a single category into one stat with 100%', () => {
    const expenses = [expense({ id: 'e1', categoryId: 'cat-1', amount: 3000 })];
    const stats = aggregateExpensesByCategory(expenses, { 'cat-1': '식비' });
    expect(stats).toEqual([{ categoryId: 'cat-1', label: '식비', amount: 3000, percentage: 100 }]);
  });

  test('sums multiple expenses in the same category', () => {
    const expenses = [
      expense({ id: 'e1', categoryId: 'cat-1', amount: 1000 }),
      expense({ id: 'e2', categoryId: 'cat-1', amount: 2000 }),
    ];
    const stats = aggregateExpensesByCategory(expenses, { 'cat-1': '식비' });
    expect(stats).toEqual([{ categoryId: 'cat-1', label: '식비', amount: 3000, percentage: 100 }]);
  });

  test('splits amounts and percentages across categories, sorted by amount descending', () => {
    const expenses = [
      expense({ id: 'e1', categoryId: 'cat-1', amount: 1000 }),
      expense({ id: 'e2', categoryId: 'cat-2', amount: 3000 }),
    ];
    const stats = aggregateExpensesByCategory(expenses, { 'cat-1': '식비', 'cat-2': '교통' });
    expect(stats).toEqual([
      { categoryId: 'cat-2', label: '교통', amount: 3000, percentage: 75 },
      { categoryId: 'cat-1', label: '식비', amount: 1000, percentage: 25 },
    ]);
  });

  test('groups expenses with no category under 미분류', () => {
    const expenses = [expense({ id: 'e1', categoryId: null, amount: 500 })];
    const stats = aggregateExpensesByCategory(expenses, {});
    expect(stats).toEqual([{ categoryId: null, label: '미분류', amount: 500, percentage: 100 }]);
  });

  test('falls back to 미분류 when a categoryId has no matching name (e.g. deleted category)', () => {
    const expenses = [expense({ id: 'e1', categoryId: 'cat-missing', amount: 500 })];
    const stats = aggregateExpensesByCategory(expenses, {});
    expect(stats).toEqual([{ categoryId: null, label: '미분류', amount: 500, percentage: 100 }]);
  });

  test('merges null categoryId and unresolvable categoryId into a single 미분류 bucket', () => {
    const expenses = [
      expense({ id: 'e1', categoryId: null, amount: 500 }),
      expense({ id: 'e2', categoryId: 'cat-missing', amount: 500 }),
    ];
    const stats = aggregateExpensesByCategory(expenses, {});
    expect(stats).toEqual([{ categoryId: null, label: '미분류', amount: 1000, percentage: 100 }]);
  });
});

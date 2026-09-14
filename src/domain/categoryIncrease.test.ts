import { findMostIncreasedCategory } from './categoryIncrease';
import type { Expense, Period } from './types';

const LATEST: Period = { id: 'latest', startDate: '2026-07-01', endDate: '2026-07-31' };
const PREVIOUS: Period = { id: 'previous', startDate: '2026-06-01', endDate: '2026-06-30' };

function expense(overrides: Partial<Expense>): Expense {
  return { id: 'e1', date: '2026-07-01', item: '테스트', amount: 1000, categoryId: 'cat-1', ...overrides };
}

const CATEGORY_NAMES = { 'cat-1': '식비', 'cat-2': '교통' };

describe('findMostIncreasedCategory', () => {
  test('returns null when there are no expenses in either period', () => {
    expect(findMostIncreasedCategory(LATEST, PREVIOUS, [], CATEGORY_NAMES)).toBeNull();
  });

  test('returns null when every category decreased or stayed the same', () => {
    const expenses = [
      expense({ id: 'e1', date: '2026-07-15', categoryId: 'cat-1', amount: 1000 }),
      expense({ id: 'e2', date: '2026-06-15', categoryId: 'cat-1', amount: 3000 }),
    ];
    expect(findMostIncreasedCategory(LATEST, PREVIOUS, expenses, CATEGORY_NAMES)).toBeNull();
  });

  test('picks the category with the largest positive increase', () => {
    const expenses = [
      expense({ id: 'e1', date: '2026-07-15', categoryId: 'cat-1', amount: 5000 }),
      expense({ id: 'e2', date: '2026-06-15', categoryId: 'cat-1', amount: 3000 }),
      expense({ id: 'e3', date: '2026-07-15', categoryId: 'cat-2', amount: 4000 }),
      expense({ id: 'e4', date: '2026-06-15', categoryId: 'cat-2', amount: 1000 }),
    ];
    // cat-1: +2000, cat-2: +3000
    expect(findMostIncreasedCategory(LATEST, PREVIOUS, expenses, CATEGORY_NAMES)).toEqual({
      categoryId: 'cat-2',
      label: '교통',
      increase: 3000,
    });
  });

  test('treats a category absent from the previous period as increasing from 0', () => {
    const expenses = [expense({ id: 'e1', date: '2026-07-15', categoryId: 'cat-1', amount: 2000 })];
    expect(findMostIncreasedCategory(LATEST, PREVIOUS, expenses, CATEGORY_NAMES)).toEqual({
      categoryId: 'cat-1',
      label: '식비',
      increase: 2000,
    });
  });

  test('treats 미분류 as its own category and includes it in comparison', () => {
    const expenses = [
      expense({ id: 'e1', date: '2026-07-15', categoryId: null, amount: 4000 }),
      expense({ id: 'e2', date: '2026-06-15', categoryId: null, amount: 1000 }),
    ];
    expect(findMostIncreasedCategory(LATEST, PREVIOUS, expenses, CATEGORY_NAMES)).toEqual({
      categoryId: null,
      label: '미분류',
      increase: 3000,
    });
  });

  test('ignores expenses outside both periods', () => {
    const expenses = [expense({ id: 'e1', date: '2026-01-01', categoryId: 'cat-1', amount: 9999 })];
    expect(findMostIncreasedCategory(LATEST, PREVIOUS, expenses, CATEGORY_NAMES)).toBeNull();
  });

  test('breaks a tie in increase amount by category display order (categoryNames key order)', () => {
    const expenses = [
      expense({ id: 'e1', date: '2026-07-15', categoryId: 'cat-1', amount: 2000 }),
      expense({ id: 'e2', date: '2026-07-15', categoryId: 'cat-2', amount: 2000 }),
    ];
    // Both increase by 2000 from a 0 previous total; cat-1 comes first in CATEGORY_NAMES.
    expect(findMostIncreasedCategory(LATEST, PREVIOUS, expenses, CATEGORY_NAMES)).toEqual({
      categoryId: 'cat-1',
      label: '식비',
      increase: 2000,
    });
  });

  test('breaks a tie between a named category and 미분류 in favor of the named category', () => {
    const expenses = [
      expense({ id: 'e1', date: '2026-07-15', categoryId: 'cat-2', amount: 2000 }),
      expense({ id: 'e2', date: '2026-07-15', categoryId: null, amount: 2000 }),
    ];
    expect(findMostIncreasedCategory(LATEST, PREVIOUS, expenses, CATEGORY_NAMES)).toEqual({
      categoryId: 'cat-2',
      label: '교통',
      increase: 2000,
    });
  });
});

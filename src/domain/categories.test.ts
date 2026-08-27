import {
  DEFAULT_CATEGORIES,
  canDeleteCategory,
  createCategory,
  ensureDefaultCategories,
  isDuplicateCategoryName,
  reclassifyExpensesForDeletedCategory,
  validateCategoryInput,
} from './categories';
import type { Expense } from './types';

test('there are 14 default categories, all marked as default', () => {
  expect(DEFAULT_CATEGORIES).toHaveLength(14);
  expect(DEFAULT_CATEGORIES.every((category) => category.isDefault)).toBe(true);
});

test('seeds the default categories when none exist yet', () => {
  const result = ensureDefaultCategories([]);

  expect(result).toEqual(DEFAULT_CATEGORIES);
});

test('seeding returns a copy, so mutating the result cannot corrupt DEFAULT_CATEGORIES', () => {
  const result = ensureDefaultCategories([]);
  result.push({ id: 'injected', name: '주입됨', isDefault: false });

  expect(DEFAULT_CATEGORIES).toHaveLength(14);
});

test('leaves existing categories untouched instead of reseeding', () => {
  const existing = [{ id: 'custom-1', name: '반려동물', isDefault: false }];

  const result = ensureDefaultCategories(existing);

  expect(result).toEqual(existing);
});

describe('validateCategoryInput', () => {
  test('rejects an empty name', () => {
    expect(validateCategoryInput({ name: '' })).toEqual({
      valid: false,
      errors: { name: '카테고리 이름을 입력해주세요.' },
    });
  });

  test('rejects a whitespace-only name', () => {
    expect(validateCategoryInput({ name: '   ' })).toEqual({
      valid: false,
      errors: { name: '카테고리 이름을 입력해주세요.' },
    });
  });

  test('accepts a non-empty name', () => {
    expect(validateCategoryInput({ name: '반려동물' })).toEqual({ valid: true, errors: {} });
  });
});

describe('createCategory', () => {
  test('creates a non-default category with the trimmed name', () => {
    expect(createCategory({ name: '  반려동물  ' }, 'custom-1')).toEqual({
      id: 'custom-1',
      name: '반려동물',
      isDefault: false,
    });
  });

  test('throws for an invalid name', () => {
    expect(() => createCategory({ name: '   ' }, 'custom-1')).toThrow();
  });
});

describe('isDuplicateCategoryName', () => {
  const categories = [
    { id: 'default-food', name: '식비', isDefault: true },
    { id: 'custom-1', name: '반려동물', isDefault: false },
  ];

  test('detects a name matching a default category', () => {
    expect(isDuplicateCategoryName('식비', categories)).toBe(true);
  });

  test('detects a name matching an existing user category', () => {
    expect(isDuplicateCategoryName('반려동물', categories)).toBe(true);
  });

  test('trims surrounding whitespace before comparing', () => {
    expect(isDuplicateCategoryName('  식비  ', categories)).toBe(true);
  });

  test('returns false for a name that does not exist yet', () => {
    expect(isDuplicateCategoryName('새 카테고리', categories)).toBe(false);
  });
});

describe('canDeleteCategory', () => {
  test('default categories cannot be deleted', () => {
    expect(canDeleteCategory({ id: 'default-food', name: '식비', isDefault: true })).toBe(false);
  });

  test('user-added categories can be deleted', () => {
    expect(canDeleteCategory({ id: 'custom-1', name: '반려동물', isDefault: false })).toBe(true);
  });
});

describe('reclassifyExpensesForDeletedCategory', () => {
  function expense(overrides: Partial<Expense>): Expense {
    return { id: 'e1', date: '2026-08-01', item: '테스트', amount: 1000, categoryId: 'custom-1', ...overrides };
  }

  test('sets categoryId to null for expenses using the deleted category', () => {
    const expenses = [expense({ id: 'e1', categoryId: 'custom-1' })];
    expect(reclassifyExpensesForDeletedCategory(expenses, 'custom-1')).toEqual([
      expense({ id: 'e1', categoryId: null }),
    ]);
  });

  test('leaves expenses in other categories untouched', () => {
    const expenses = [
      expense({ id: 'e1', categoryId: 'custom-1' }),
      expense({ id: 'e2', categoryId: 'default-food' }),
      expense({ id: 'e3', categoryId: null }),
    ];
    expect(reclassifyExpensesForDeletedCategory(expenses, 'custom-1')).toEqual([
      expense({ id: 'e1', categoryId: null }),
      expense({ id: 'e2', categoryId: 'default-food' }),
      expense({ id: 'e3', categoryId: null }),
    ]);
  });

  test('returns an empty array unchanged', () => {
    expect(reclassifyExpensesForDeletedCategory([], 'custom-1')).toEqual([]);
  });
});

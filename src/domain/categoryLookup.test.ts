import { buildCategoryNameMap, resolveCategoryLabel } from './categoryLookup';
import type { Category } from './types';

const categories: Category[] = [
  { id: 'default-food', name: '식비', isDefault: true },
  { id: 'custom-1', name: '반려동물', isDefault: false },
];

describe('buildCategoryNameMap', () => {
  test('maps each category id to its name', () => {
    expect(buildCategoryNameMap(categories)).toEqual({
      'default-food': '식비',
      'custom-1': '반려동물',
    });
  });

  test('returns an empty map for an empty list', () => {
    expect(buildCategoryNameMap([])).toEqual({});
  });
});

describe('resolveCategoryLabel', () => {
  const names = buildCategoryNameMap(categories);

  test('returns the category name when the id resolves', () => {
    expect(resolveCategoryLabel('default-food', names)).toBe('식비');
  });

  test('returns 미분류 when categoryId is null', () => {
    expect(resolveCategoryLabel(null, names)).toBe('미분류');
  });

  test('returns 미분류 when the categoryId no longer exists in the map', () => {
    expect(resolveCategoryLabel('deleted-category', names)).toBe('미분류');
  });
});

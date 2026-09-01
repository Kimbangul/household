import { DEFAULT_CATEGORIES } from '../domain/categories';
import { getCategoryIcon } from './categoryIcons';

describe('getCategoryIcon', () => {
  test('returns an icon for every default category', () => {
    for (const category of DEFAULT_CATEGORIES) {
      expect(getCategoryIcon(category.id)).toBeDefined();
    }
  });

  test('returns undefined for a custom category id', () => {
    expect(getCategoryIcon('category-1700000000000')).toBeUndefined();
  });

  test('returns undefined for the 미분류 (null) case', () => {
    expect(getCategoryIcon(null)).toBeUndefined();
  });

  test('returns undefined for an unrecognized id', () => {
    expect(getCategoryIcon('not-a-real-id')).toBeUndefined();
  });
});

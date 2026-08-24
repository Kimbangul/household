import { DEFAULT_CATEGORIES, ensureDefaultCategories } from './categories';

test('there are 14 default categories, all marked as default', () => {
  expect(DEFAULT_CATEGORIES).toHaveLength(14);
  expect(DEFAULT_CATEGORIES.every((category) => category.isDefault)).toBe(true);
});

test('seeds the default categories when none exist yet', () => {
  const result = ensureDefaultCategories([]);

  expect(result).toEqual(DEFAULT_CATEGORIES);
});

test('leaves existing categories untouched instead of reseeding', () => {
  const existing = [{ id: 'custom-1', name: '반려동물', isDefault: false }];

  const result = ensureDefaultCategories(existing);

  expect(result).toEqual(existing);
});

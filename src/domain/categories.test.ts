import { DEFAULT_CATEGORIES, ensureDefaultCategories } from './categories';

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

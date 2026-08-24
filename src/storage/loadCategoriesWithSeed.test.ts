import { DEFAULT_CATEGORIES } from '../domain/categories';
import { createInMemoryRepository } from './inMemoryRepository';
import { loadCategoriesWithSeed } from './loadCategoriesWithSeed';

test('seeds and persists the default categories on first load', async () => {
  const repository = createInMemoryRepository();

  const categories = await loadCategoriesWithSeed(repository);

  expect(categories).toEqual(DEFAULT_CATEGORIES);
  expect(await repository.getCategories()).toEqual(DEFAULT_CATEGORIES);
});

test('does not reseed when categories already exist', async () => {
  const repository = createInMemoryRepository();
  const existing = [{ id: 'custom-1', name: '반려동물', isDefault: false }];
  await repository.saveCategories(existing);

  const categories = await loadCategoriesWithSeed(repository);

  expect(categories).toEqual(existing);
});

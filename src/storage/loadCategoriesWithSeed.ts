import { ensureDefaultCategories } from '../domain/categories';
import type { LedgerRepository } from './types';

export async function loadCategoriesWithSeed(repository: LedgerRepository) {
  const existing = await repository.getCategories();
  const categories = ensureDefaultCategories(existing);

  if (categories !== existing) {
    await repository.saveCategories(categories);
  }

  return categories;
}

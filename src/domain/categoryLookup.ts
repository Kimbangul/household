import type { Category } from './types';

export function buildCategoryNameMap(categories: Category[]): Record<string, string> {
  return categories.reduce<Record<string, string>>((names, category) => {
    names[category.id] = category.name;
    return names;
  }, {});
}

export function resolveCategoryLabel(
  categoryId: string | null,
  categoryNames: Record<string, string>,
): string {
  if (!categoryId) {
    return '미분류';
  }
  return categoryNames[categoryId] ?? '미분류';
}

import { resolveCategoryLabel } from './categoryLookup';
import type { Expense } from './types';

export interface CategoryStat {
  categoryId: string | null;
  label: string;
  amount: number;
  percentage: number;
}

export function aggregateExpensesByCategory(
  expenses: Expense[],
  categoryNames: Record<string, string>,
): CategoryStat[] {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const amountsByKey = new Map<string | null, number>();
  for (const expense of expenses) {
    // Any category the lookup can't resolve (deleted category, or no category
    // at all) collapses into the same 미분류 bucket, keyed by null, so the
    // chart never shows two separate "미분류" slices.
    const isUncategorized = expense.categoryId === null || !(expense.categoryId in categoryNames);
    const key = isUncategorized ? null : expense.categoryId;
    amountsByKey.set(key, (amountsByKey.get(key) ?? 0) + expense.amount);
  }

  const stats = Array.from(amountsByKey.entries()).map(([categoryId, amount]) => ({
    categoryId,
    label: resolveCategoryLabel(categoryId, categoryNames),
    amount,
    percentage: total === 0 ? 0 : (amount / total) * 100,
  }));

  return stats.sort((a, b) => b.amount - a.amount);
}

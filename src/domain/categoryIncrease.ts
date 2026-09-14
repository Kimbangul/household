import { aggregateExpensesByCategory } from './categoryStats';
import { getRecordsInPeriod } from './periodRecords';
import type { Expense, Period } from './types';

export interface CategoryIncrease {
  categoryId: string | null;
  label: string;
  increase: number;
}

export function findMostIncreasedCategory(
  latest: Period,
  previous: Period,
  expenses: Expense[],
  categoryNames: Record<string, string>,
): CategoryIncrease | null {
  const latestStats = aggregateExpensesByCategory(getRecordsInPeriod(expenses, latest), categoryNames);
  const previousAmounts = new Map(
    aggregateExpensesByCategory(getRecordsInPeriod(expenses, previous), categoryNames).map((stat) => [
      stat.categoryId,
      stat.amount,
    ]),
  );

  // Mirrors categoryNames' key order (== the settings screen's category
  // display order) for tie-breaking. 미분류 (categoryId null) has no position
  // there, so it sorts after every named category on a tie.
  const orderIndex = new Map(Object.keys(categoryNames).map((categoryId, index) => [categoryId, index]));
  const tieOrder = (categoryId: string | null): number =>
    (categoryId === null ? undefined : orderIndex.get(categoryId)) ?? Number.MAX_SAFE_INTEGER;

  let best: CategoryIncrease | null = null;
  for (const stat of latestStats) {
    const increase = stat.amount - (previousAmounts.get(stat.categoryId) ?? 0);
    if (increase <= 0) {
      continue;
    }
    if (
      !best ||
      increase > best.increase ||
      (increase === best.increase && tieOrder(stat.categoryId) < tieOrder(best.categoryId))
    ) {
      best = { categoryId: stat.categoryId, label: stat.label, increase };
    }
  }

  return best;
}

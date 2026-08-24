import type { Expense } from './types';

export function getRecentExpenses(expenses: Expense[], limit?: number): Expense[] {
  // reverse() before the stable sort so same-date entries keep the
  // later-inserted one first, instead of falling back to input order.
  const sorted = [...expenses]
    .reverse()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return limit === undefined ? sorted : sorted.slice(0, limit);
}

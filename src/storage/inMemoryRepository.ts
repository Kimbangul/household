import type { Category, Expense, Period } from '../domain/types';
import type { LedgerRepository } from './types';

export function createInMemoryRepository(): LedgerRepository {
  let categories: Category[] = [];
  let expenses: Expense[] = [];
  let periods: Period[] = [];

  return {
    async getCategories() {
      return categories;
    },
    async saveCategories(next) {
      categories = next;
    },
    async getExpenses() {
      return expenses;
    },
    async saveExpenses(next) {
      expenses = next;
    },
    async getPeriods() {
      return periods;
    },
    async savePeriods(next) {
      periods = next;
    },
  };
}

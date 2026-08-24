import type { Category, Expense, Period } from '../domain/types';

export interface LedgerRepository {
  getCategories(): Promise<Category[]>;
  saveCategories(categories: Category[]): Promise<void>;
  getExpenses(): Promise<Expense[]>;
  saveExpenses(expenses: Expense[]): Promise<void>;
  getPeriods(): Promise<Period[]>;
  savePeriods(periods: Period[]): Promise<void>;
}

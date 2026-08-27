import type { Settings } from '../domain/settings';
import type { Category, Expense, IncomeEntry, Period } from '../domain/types';

export interface LedgerRepository {
  getCategories(): Promise<Category[]>;
  saveCategories(categories: Category[]): Promise<void>;
  getExpenses(): Promise<Expense[]>;
  saveExpenses(expenses: Expense[]): Promise<void>;
  getPeriods(): Promise<Period[]>;
  savePeriods(periods: Period[]): Promise<void>;
  getIncomeEntries(): Promise<IncomeEntry[]>;
  saveIncomeEntries(incomeEntries: IncomeEntry[]): Promise<void>;
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
}

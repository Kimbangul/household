import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_SETTINGS, type Settings } from '../domain/settings';
import type { Category, Expense, IncomeEntry, Period } from '../domain/types';
import type { LedgerRepository } from './types';

const STORAGE_KEYS = {
  categories: 'household-ledger/categories',
  expenses: 'household-ledger/expenses',
  periods: 'household-ledger/periods',
  incomeEntries: 'household-ledger/incomeEntries',
  settings: 'household-ledger/settings',
};

async function readJson<T>(key: string, defaultValue: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    return defaultValue;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export function createAsyncStorageRepository(): LedgerRepository {
  return {
    getCategories: () => readJson<Category[]>(STORAGE_KEYS.categories, []),
    saveCategories: (categories) => writeJson(STORAGE_KEYS.categories, categories),
    getExpenses: () => readJson<Expense[]>(STORAGE_KEYS.expenses, []),
    saveExpenses: (expenses) => writeJson(STORAGE_KEYS.expenses, expenses),
    getPeriods: () => readJson<Period[]>(STORAGE_KEYS.periods, []),
    savePeriods: (periods) => writeJson(STORAGE_KEYS.periods, periods),
    getIncomeEntries: () => readJson<IncomeEntry[]>(STORAGE_KEYS.incomeEntries, []),
    saveIncomeEntries: (incomeEntries) => writeJson(STORAGE_KEYS.incomeEntries, incomeEntries),
    getSettings: () => readJson<Settings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS),
    saveSettings: (settings) => writeJson(STORAGE_KEYS.settings, settings),
  };
}

import { DEFAULT_SETTINGS } from '../domain/settings';
import type { LedgerRepository } from './types';

/**
 * Shared behaviour every LedgerRepository implementation must satisfy.
 * Run against each concrete implementation (in-memory, AsyncStorage-backed, ...).
 */
export function testsRepositoryContract(createRepository: () => LedgerRepository) {
  test('starts out with no categories, expenses, periods, or income entries', async () => {
    const repository = createRepository();

    expect(await repository.getCategories()).toEqual([]);
    expect(await repository.getExpenses()).toEqual([]);
    expect(await repository.getPeriods()).toEqual([]);
    expect(await repository.getIncomeEntries()).toEqual([]);
  });

  test('starts out with default settings', async () => {
    const repository = createRepository();

    expect(await repository.getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  test('settings written can be read back unchanged', async () => {
    const repository = createRepository();

    await repository.saveSettings({ darkMode: true });

    expect(await repository.getSettings()).toEqual({ darkMode: true });
  });

  test('categories written can be read back unchanged', async () => {
    const repository = createRepository();
    const categories = [{ id: 'c1', name: '식비', isDefault: true }];

    await repository.saveCategories(categories);

    expect(await repository.getCategories()).toEqual(categories);
  });

  test('expenses written can be read back unchanged', async () => {
    const repository = createRepository();
    const expenses = [
      { id: 'e1', date: '2026-07-01', item: '점심', amount: 12000, categoryId: 'c1' },
    ];

    await repository.saveExpenses(expenses);

    expect(await repository.getExpenses()).toEqual(expenses);
  });

  test('periods written can be read back unchanged', async () => {
    const repository = createRepository();
    const periods = [{ id: 'p1', startDate: '2026-06-25', endDate: '2026-07-24' }];

    await repository.savePeriods(periods);

    expect(await repository.getPeriods()).toEqual(periods);
  });

  test('income entries written can be read back unchanged', async () => {
    const repository = createRepository();
    const incomeEntries = [{ id: 'i1', date: '2026-07-01', item: '7월 급여', amount: 3000000 }];

    await repository.saveIncomeEntries(incomeEntries);

    expect(await repository.getIncomeEntries()).toEqual(incomeEntries);
  });
}

import type { LedgerRepository } from './types';

/**
 * Shared behaviour every LedgerRepository implementation must satisfy.
 * Run against each concrete implementation (in-memory, AsyncStorage-backed, ...).
 */
export function testsRepositoryContract(createRepository: () => LedgerRepository) {
  test('starts out with no categories, expenses, or periods', async () => {
    const repository = createRepository();

    expect(await repository.getCategories()).toEqual([]);
    expect(await repository.getExpenses()).toEqual([]);
    expect(await repository.getPeriods()).toEqual([]);
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
    const periods = [{ id: 'p1', startDate: '2026-06-25', endDate: '2026-07-24', income: 3000000 }];

    await repository.savePeriods(periods);

    expect(await repository.getPeriods()).toEqual(periods);
  });
}

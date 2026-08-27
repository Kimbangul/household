import type { Period } from '../domain/types';
import { createInMemoryRepository } from './inMemoryRepository';
import { migrateIncomeEntriesFromPeriods } from './migrateLegacyPeriodIncome';

test('converts a legacy period income value into an income entry and strips it from the period', async () => {
  const repository = createInMemoryRepository();
  const legacyPeriod = { id: 'period-1', startDate: '2026-07-28', endDate: '2026-08-26', income: 3000000 };
  await repository.savePeriods([legacyPeriod as unknown as Period]);

  await migrateIncomeEntriesFromPeriods(repository);

  expect(await repository.getIncomeEntries()).toEqual([
    { id: 'period-1-legacy-income', date: '2026-07-28', item: '이전 수입', amount: 3000000 },
  ]);
  expect(await repository.getPeriods()).toEqual([
    { id: 'period-1', startDate: '2026-07-28', endDate: '2026-08-26' },
  ]);
});

test('does nothing when no period has a legacy income value', async () => {
  const repository = createInMemoryRepository();
  const period: Period = { id: 'period-1', startDate: '2026-07-28', endDate: '2026-08-26' };
  await repository.savePeriods([period]);

  await migrateIncomeEntriesFromPeriods(repository);

  expect(await repository.getIncomeEntries()).toEqual([]);
  expect(await repository.getPeriods()).toEqual([period]);
});

test('preserves income entries that already exist', async () => {
  const repository = createInMemoryRepository();
  const legacyPeriod = { id: 'period-1', startDate: '2026-07-28', endDate: '2026-08-26', income: 3000000 };
  await repository.savePeriods([legacyPeriod as unknown as Period]);
  const existingEntry = { id: 'income-manual-1', date: '2026-08-10', item: '부수입', amount: 50000 };
  await repository.saveIncomeEntries([existingEntry]);

  await migrateIncomeEntriesFromPeriods(repository);

  expect(await repository.getIncomeEntries()).toEqual([
    existingEntry,
    { id: 'period-1-legacy-income', date: '2026-07-28', item: '이전 수입', amount: 3000000 },
  ]);
});

test('strips a legacy income:0 field even though it produces no income entry', async () => {
  const repository = createInMemoryRepository();
  const legacyPeriod = { id: 'period-1', startDate: '2026-07-28', endDate: '2026-08-26', income: 0 };
  await repository.savePeriods([legacyPeriod as unknown as Period]);

  await migrateIncomeEntriesFromPeriods(repository);

  expect(await repository.getIncomeEntries()).toEqual([]);
  expect(await repository.getPeriods()).toEqual([
    { id: 'period-1', startDate: '2026-07-28', endDate: '2026-08-26' },
  ]);
});

test('is idempotent: running it again after migration does not duplicate the entry', async () => {
  const repository = createInMemoryRepository();
  const legacyPeriod = { id: 'period-1', startDate: '2026-07-28', endDate: '2026-08-26', income: 3000000 };
  await repository.savePeriods([legacyPeriod as unknown as Period]);

  await migrateIncomeEntriesFromPeriods(repository);
  await migrateIncomeEntriesFromPeriods(repository);

  expect(await repository.getIncomeEntries()).toEqual([
    { id: 'period-1-legacy-income', date: '2026-07-28', item: '이전 수입', amount: 3000000 },
  ]);
});

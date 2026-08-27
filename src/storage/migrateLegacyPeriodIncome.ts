import { migrateLegacyPeriodIncome, type PeriodWithLegacyIncome } from '../domain/incomeMigration';
import type { LedgerRepository } from './types';

// Periods used to carry a single `income` number directly. Now that income is
// tracked as itemized entries, this runs once on startup to convert any
// still-legacy periods into an equivalent income entry, then rewrites the
// periods without the old field so this doesn't re-migrate on the next load.
export async function migrateIncomeEntriesFromPeriods(repository: LedgerRepository): Promise<void> {
  const periods = await repository.getPeriods();
  const legacyPeriods = periods as unknown as PeriodWithLegacyIncome[];

  // Checked separately from `migratedEntries.length`: a period with a legacy
  // `income: 0` produces no entry (there's nothing to migrate) but still
  // carries the now-unused field and should still be cleaned up, or it would
  // never get rewritten and this function would never truly finish migrating
  // that period.
  const hasLegacyField = legacyPeriods.some((period) => 'income' in period);
  if (!hasLegacyField) {
    return;
  }

  const migratedEntries = migrateLegacyPeriodIncome(legacyPeriods);
  if (migratedEntries.length > 0) {
    const existingIncomeEntries = await repository.getIncomeEntries();
    await repository.saveIncomeEntries([...existingIncomeEntries, ...migratedEntries]);
  }

  const cleanedPeriods = periods.map(({ id, startDate, endDate }) => ({ id, startDate, endDate }));
  await repository.savePeriods(cleanedPeriods);
}

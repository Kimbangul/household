import { migrateLegacyPeriodIncome, type PeriodWithLegacyIncome } from './incomeMigration';

describe('migrateLegacyPeriodIncome', () => {
  test('returns no entries for an empty period list', () => {
    expect(migrateLegacyPeriodIncome([])).toEqual([]);
  });

  test('converts a period with a positive legacy income into one income entry dated to the start date', () => {
    const periods: PeriodWithLegacyIncome[] = [
      { id: 'period-1', startDate: '2026-07-28', endDate: '2026-08-26', income: 3000000 },
    ];
    expect(migrateLegacyPeriodIncome(periods)).toEqual([
      { id: 'period-1-legacy-income', date: '2026-07-28', item: '이전 수입', amount: 3000000 },
    ]);
  });

  test('skips a period with no income field at all', () => {
    const periods: PeriodWithLegacyIncome[] = [{ id: 'period-1', startDate: '2026-07-28', endDate: '2026-08-26' }];
    expect(migrateLegacyPeriodIncome(periods)).toEqual([]);
  });

  test('skips a period with a zero legacy income', () => {
    const periods: PeriodWithLegacyIncome[] = [
      { id: 'period-1', startDate: '2026-07-28', endDate: '2026-08-26', income: 0 },
    ];
    expect(migrateLegacyPeriodIncome(periods)).toEqual([]);
  });

  test('migrates multiple periods independently', () => {
    const periods: PeriodWithLegacyIncome[] = [
      { id: 'period-1', startDate: '2026-07-28', endDate: '2026-08-26', income: 3000000 },
      { id: 'period-2', startDate: '2026-08-27', endDate: '2026-09-27', income: 3200000 },
    ];
    expect(migrateLegacyPeriodIncome(periods)).toEqual([
      { id: 'period-1-legacy-income', date: '2026-07-28', item: '이전 수입', amount: 3000000 },
      { id: 'period-2-legacy-income', date: '2026-08-27', item: '이전 수입', amount: 3200000 },
    ]);
  });
});

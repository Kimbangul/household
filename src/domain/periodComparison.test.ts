import { compareRecentPeriods } from './periodComparison';
import type { Expense, Period } from './types';

const TODAY = '2026-08-27';

function period(overrides: Partial<Period>): Period {
  return { id: 'p1', startDate: '2026-07-01', endDate: '2026-07-31', income: 0, ...overrides };
}

function expense(overrides: Partial<Expense>): Expense {
  return { id: 'e1', date: '2026-07-01', item: '테스트', amount: 1000, categoryId: null, ...overrides };
}

describe('compareRecentPeriods', () => {
  test('returns null when there are no periods', () => {
    expect(compareRecentPeriods([], [], TODAY)).toBeNull();
  });

  test('returns null when there is only one eligible (already-started) period', () => {
    const periods = [period({ id: 'p1', startDate: '2026-07-01', endDate: '2026-07-31' })];
    expect(compareRecentPeriods(periods, [], TODAY)).toBeNull();
  });

  test('picks the two eligible periods with the latest end dates, regardless of input order', () => {
    const periods = [
      period({ id: 'oldest', startDate: '2026-05-01', endDate: '2026-05-31' }),
      period({ id: 'latest', startDate: '2026-07-01', endDate: '2026-07-31' }),
      period({ id: 'previous', startDate: '2026-06-01', endDate: '2026-06-30' }),
    ];
    const result = compareRecentPeriods(periods, [], TODAY);
    expect(result?.latest.id).toBe('latest');
    expect(result?.previous.id).toBe('previous');
  });

  test('includes an in-progress period (already started, not yet ended) as the latest', () => {
    const periods = [
      period({ id: 'ended', startDate: '2026-07-28', endDate: '2026-08-26' }),
      period({ id: 'in-progress', startDate: '2026-08-27', endDate: '2026-09-27' }),
    ];
    const result = compareRecentPeriods(periods, [], TODAY);
    expect(result?.latest.id).toBe('in-progress');
    expect(result?.previous.id).toBe('ended');
  });

  test('excludes a period that has not started yet, even if its end date is the latest', () => {
    const periods = [
      period({ id: 'ended-1', startDate: '2026-06-01', endDate: '2026-06-30' }),
      period({ id: 'ended-2', startDate: '2026-07-01', endDate: '2026-07-31' }),
      period({ id: 'not-started-yet', startDate: '2026-09-01', endDate: '2026-09-30' }),
    ];
    const result = compareRecentPeriods(periods, [], TODAY);
    expect(result?.latest.id).toBe('ended-2');
    expect(result?.previous.id).toBe('ended-1');
  });

  test('returns null when only one period has started, even with an upcoming period present', () => {
    const periods = [
      period({ id: 'ended', startDate: '2026-07-01', endDate: '2026-07-31' }),
      period({ id: 'not-started-yet', startDate: '2026-09-01', endDate: '2026-09-30' }),
    ];
    expect(compareRecentPeriods(periods, [], TODAY)).toBeNull();
  });

  test('breaks an end-date tie by the later start date', () => {
    const periods = [
      period({ id: 'started-earlier', startDate: '2026-06-01', endDate: '2026-07-15' }),
      period({ id: 'started-later', startDate: '2026-07-01', endDate: '2026-07-15' }),
    ];
    const result = compareRecentPeriods(periods, [], TODAY);
    expect(result?.latest.id).toBe('started-later');
    expect(result?.previous.id).toBe('started-earlier');
  });

  test('sums each period expenses independently and reports a positive difference on an increase', () => {
    const latest = period({ id: 'latest', startDate: '2026-07-01', endDate: '2026-07-31' });
    const previous = period({ id: 'previous', startDate: '2026-06-01', endDate: '2026-06-30' });
    const expenses = [
      expense({ id: 'e1', date: '2026-07-15', amount: 5000 }),
      expense({ id: 'e2', date: '2026-06-15', amount: 2000 }),
    ];
    const result = compareRecentPeriods([latest, previous], expenses, TODAY);
    expect(result).toEqual({
      latest,
      previous,
      latestTotal: 5000,
      previousTotal: 2000,
      difference: 3000,
    });
  });

  test('reports a negative difference on a decrease', () => {
    const latest = period({ id: 'latest', startDate: '2026-07-01', endDate: '2026-07-31' });
    const previous = period({ id: 'previous', startDate: '2026-06-01', endDate: '2026-06-30' });
    const expenses = [
      expense({ id: 'e1', date: '2026-07-15', amount: 1000 }),
      expense({ id: 'e2', date: '2026-06-15', amount: 4000 }),
    ];
    const result = compareRecentPeriods([latest, previous], expenses, TODAY);
    expect(result?.difference).toBe(-3000);
  });

  test('ignores expenses outside both periods', () => {
    const latest = period({ id: 'latest', startDate: '2026-07-01', endDate: '2026-07-31' });
    const previous = period({ id: 'previous', startDate: '2026-06-01', endDate: '2026-06-30' });
    const expenses = [expense({ id: 'e1', date: '2026-01-01', amount: 9999 })];
    const result = compareRecentPeriods([latest, previous], expenses, TODAY);
    expect(result).toEqual({ latest, previous, latestTotal: 0, previousTotal: 0, difference: 0 });
  });
});

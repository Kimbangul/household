import { createPeriod, isFuturePeriod, isPastPeriod, suggestNextPeriodStartDate, validatePeriodInput } from './period';
import type { Period } from './types';

const validInput = { startDate: '2026-08-01', endDate: '2026-08-31' };

describe('validatePeriodInput', () => {
  test('accepts a valid range', () => {
    expect(validatePeriodInput(validInput)).toEqual({ valid: true, errors: {} });
  });

  test('accepts a single-day range', () => {
    expect(validatePeriodInput({ startDate: '2026-08-01', endDate: '2026-08-01' })).toEqual({
      valid: true,
      errors: {},
    });
  });

  test('rejects a malformed start date', () => {
    const result = validatePeriodInput({ ...validInput, startDate: '2026/08/01' });
    expect(result.valid).toBe(false);
    expect(result.errors.startDate).toBeDefined();
  });

  test('rejects a malformed end date', () => {
    const result = validatePeriodInput({ ...validInput, endDate: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.endDate).toBeDefined();
  });

  test('rejects an end date before the start date', () => {
    const result = validatePeriodInput({ startDate: '2026-08-31', endDate: '2026-08-01' });
    expect(result.valid).toBe(false);
    expect(result.errors.endDate).toBeDefined();
  });
});

describe('createPeriod', () => {
  test('builds a Period with zero income from a valid input and the given id', () => {
    expect(createPeriod(validInput, 'period-1')).toEqual({
      id: 'period-1',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      income: 0,
    });
  });

  test('throws when the input is invalid', () => {
    expect(() => createPeriod({ startDate: '2026-08-31', endDate: '2026-08-01' }, 'period-2')).toThrow();
  });
});

describe('suggestNextPeriodStartDate', () => {
  test('suggests today when there are no periods', () => {
    expect(suggestNextPeriodStartDate([], '2026-08-24')).toBe('2026-08-24');
  });

  test('suggests the day after the most recently added period ends', () => {
    const periods: Period[] = [
      { id: 'p1', startDate: '2026-07-01', endDate: '2026-07-31', income: 0 },
      { id: 'p2', startDate: '2026-08-01', endDate: '2026-08-15', income: 0 },
    ];
    expect(suggestNextPeriodStartDate(periods, '2026-08-24')).toBe('2026-08-16');
  });

  test('rolls over into the next month when suggesting from a month-end', () => {
    const periods: Period[] = [{ id: 'p1', startDate: '2026-08-01', endDate: '2026-08-31', income: 0 }];
    expect(suggestNextPeriodStartDate(periods, '2026-09-05')).toBe('2026-09-01');
  });
});

describe('isPastPeriod', () => {
  test('is past when the end date is before today', () => {
    const period: Period = { id: 'p1', startDate: '2026-08-01', endDate: '2026-08-10', income: 0 };
    expect(isPastPeriod(period, '2026-08-24')).toBe(true);
  });

  test('is not past when the end date is today', () => {
    const period: Period = { id: 'p1', startDate: '2026-08-01', endDate: '2026-08-24', income: 0 };
    expect(isPastPeriod(period, '2026-08-24')).toBe(false);
  });

  test('is not past when the end date is in the future', () => {
    const period: Period = { id: 'p1', startDate: '2026-08-01', endDate: '2026-08-25', income: 0 };
    expect(isPastPeriod(period, '2026-08-24')).toBe(false);
  });
});

describe('isFuturePeriod', () => {
  test('is future when the start date is after today', () => {
    const period: Period = { id: 'p1', startDate: '2026-08-25', endDate: '2026-09-10', income: 0 };
    expect(isFuturePeriod(period, '2026-08-24')).toBe(true);
  });

  test('is not future when the start date is today (already started)', () => {
    const period: Period = { id: 'p1', startDate: '2026-08-24', endDate: '2026-09-10', income: 0 };
    expect(isFuturePeriod(period, '2026-08-24')).toBe(false);
  });

  test('is not future when the start date is in the past', () => {
    const period: Period = { id: 'p1', startDate: '2026-08-01', endDate: '2026-09-10', income: 0 };
    expect(isFuturePeriod(period, '2026-08-24')).toBe(false);
  });
});

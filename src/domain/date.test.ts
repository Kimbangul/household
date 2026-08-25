import { addDaysToDateString, isValidCalendarDate } from './date';

describe('isValidCalendarDate', () => {
  test('accepts a real calendar date', () => {
    expect(isValidCalendarDate('2026-08-24')).toBe(true);
  });

  test('rejects an empty string', () => {
    expect(isValidCalendarDate('')).toBe(false);
  });

  test('rejects a malformed date', () => {
    expect(isValidCalendarDate('2026/08/24')).toBe(false);
  });

  test('rejects a date that does not exist', () => {
    expect(isValidCalendarDate('2026-02-30')).toBe(false);
  });

  test('accepts a year below 100 without century coercion', () => {
    expect(isValidCalendarDate('0026-08-24')).toBe(true);
  });
});

describe('addDaysToDateString', () => {
  test('adds a day within the same month', () => {
    expect(addDaysToDateString('2026-08-24', 1)).toBe('2026-08-25');
  });

  test('rolls over to the next month', () => {
    expect(addDaysToDateString('2026-08-31', 1)).toBe('2026-09-01');
  });

  test('rolls over to the next year', () => {
    expect(addDaysToDateString('2026-12-31', 1)).toBe('2027-01-01');
  });

  test('handles leap day rollover', () => {
    expect(addDaysToDateString('2028-02-28', 1)).toBe('2028-02-29');
  });

  test('preserves a year below 100 without century coercion', () => {
    expect(addDaysToDateString('0026-08-24', 1)).toBe('0026-08-25');
  });
});

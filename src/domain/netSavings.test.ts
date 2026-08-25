import { calculateNetSavings } from './netSavings';

describe('calculateNetSavings', () => {
  test('subtracts expense total from income', () => {
    expect(calculateNetSavings(500000, 320000)).toBe(180000);
  });

  test('returns a negative value when expenses exceed income', () => {
    expect(calculateNetSavings(100000, 150000)).toBe(-50000);
  });

  test('returns 0 when income equals expenses', () => {
    expect(calculateNetSavings(100000, 100000)).toBe(0);
  });

  test('returns the negated expense total when income is 0', () => {
    expect(calculateNetSavings(0, 30000)).toBe(-30000);
  });

  test('returns income as-is when there are no expenses', () => {
    expect(calculateNetSavings(200000, 0)).toBe(200000);
  });
});

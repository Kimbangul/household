import { formatCurrency } from './currency';

test('formats a small amount with the won sign', () => {
  expect(formatCurrency(999)).toBe('₩999');
});

test('adds thousand separators', () => {
  expect(formatCurrency(1000)).toBe('₩1,000');
  expect(formatCurrency(1234567)).toBe('₩1,234,567');
});

test('formats zero', () => {
  expect(formatCurrency(0)).toBe('₩0');
});

test('rounds fractional amounts before formatting', () => {
  expect(formatCurrency(12345.6)).toBe('₩12,346');
});

test('formats negative amounts with a leading minus before the sign', () => {
  expect(formatCurrency(-2000)).toBe('-₩2,000');
});

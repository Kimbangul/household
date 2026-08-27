import { CATEGORY_CHIP_COLORS, getCategoryChipColor, getCategoryInitial } from './categoryChip';

describe('getCategoryChipColor', () => {
  test('returns a color from the fixed palette', () => {
    expect(CATEGORY_CHIP_COLORS).toContain(getCategoryChipColor('default-food'));
  });

  test('is deterministic: the same category id always returns the same color', () => {
    const first = getCategoryChipColor('default-food');
    const second = getCategoryChipColor('default-food');
    expect(first).toBe(second);
  });

  test('returns a color from the fixed palette for a null (미분류) category id', () => {
    expect(CATEGORY_CHIP_COLORS).toContain(getCategoryChipColor(null));
  });

  test('is deterministic for null as well', () => {
    expect(getCategoryChipColor(null)).toBe(getCategoryChipColor(null));
  });
});

describe('getCategoryInitial', () => {
  test('returns the first character of the label', () => {
    expect(getCategoryInitial('식비')).toBe('식');
  });

  test('uppercases a latin first character', () => {
    expect(getCategoryInitial('travel')).toBe('T');
  });

  test('falls back to a placeholder character for an empty label', () => {
    expect(getCategoryInitial('')).toBe('?');
  });

  test('falls back to a placeholder character for a whitespace-only label', () => {
    expect(getCategoryInitial('   ')).toBe('?');
  });
});

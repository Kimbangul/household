import { withAlpha } from './withAlpha';

describe('withAlpha', () => {
  test('appends a 2-digit hex alpha suffix', () => {
    expect(withAlpha('#3629b7', 0.1)).toBe('#3629b71a');
  });

  test('rounds to the nearest hex step', () => {
    expect(withAlpha('#3629b7', 0.4)).toBe('#3629b766');
  });

  test('pads single-digit hex values to two digits', () => {
    expect(withAlpha('#3629b7', 0)).toBe('#3629b700');
  });

  test('reaches full opacity at 1', () => {
    expect(withAlpha('#3629b7', 1)).toBe('#3629b7ff');
  });
});

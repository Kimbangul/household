import { computeSliceAngles, describeArcPath } from './pieSlices';

describe('computeSliceAngles', () => {
  test('returns an empty array for no percentages', () => {
    expect(computeSliceAngles([])).toEqual([]);
  });

  test('a single 100% slice spans the full circle starting at 0', () => {
    expect(computeSliceAngles([100])).toEqual([{ startAngle: 0, endAngle: 360 }]);
  });

  test('splits contiguous slices with no gaps or overlaps', () => {
    expect(computeSliceAngles([25, 75])).toEqual([
      { startAngle: 0, endAngle: 90 },
      { startAngle: 90, endAngle: 360 },
    ]);
  });

  test('three equal slices each span 120 degrees', () => {
    const slices = computeSliceAngles([100 / 3, 100 / 3, 100 / 3]);
    expect(slices[0].startAngle).toBe(0);
    expect(slices[2].endAngle).toBe(360);
    // Each slice's start matches the previous slice's end (contiguous).
    expect(slices[1].startAngle).toBeCloseTo(slices[0].endAngle);
    expect(slices[2].startAngle).toBeCloseTo(slices[1].endAngle);
  });
});

describe('describeArcPath', () => {
  test('draws a quarter arc as a wedge from center', () => {
    // center=10, radius=10: angle 0 is straight up (10,0); angle 90 is to the
    // right (20,10) — clockwise from 12 o'clock.
    const path = describeArcPath(10, 10, 0, 90);
    expect(path).toBe('M 10 10 L 10 0 A 10 10 0 0 1 20 10 Z');
  });

  test('uses the large-arc-flag for a sweep greater than 180 degrees', () => {
    const path = describeArcPath(10, 10, 0, 270);
    expect(path).toContain('A 10 10 0 1 1');
  });

  test('does not use the large-arc-flag for a sweep of exactly 180 degrees', () => {
    const path = describeArcPath(10, 10, 0, 180);
    expect(path).toContain('A 10 10 0 0 1');
  });

  test('draws a full circle (two half-arcs) when the sweep is 360 degrees', () => {
    const path = describeArcPath(10, 10, 0, 360);
    expect(path).toBe('M 0 10 A 10 10 0 1 1 20 10 A 10 10 0 1 1 0 10 Z');
  });
});

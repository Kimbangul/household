import { groupByDate } from './dateGroups';

interface Dated {
  id: string;
  date: string;
}

function item(id: string, date: string): Dated {
  return { id, date };
}

const TODAY = '2026-08-27';

describe('groupByDate', () => {
  test('returns an empty list for an empty input', () => {
    expect(groupByDate([], TODAY)).toEqual([]);
  });

  test('groups a single item under its own date', () => {
    const a = item('a', '2026-08-27');
    expect(groupByDate([a], TODAY)).toEqual([{ label: '오늘', date: '2026-08-27', items: [a] }]);
  });

  test('buckets multiple items on the same date into one group, preserving input order within the group', () => {
    const a = item('a', '2026-08-20');
    const b = item('b', '2026-08-20');
    const groups = groupByDate([a, b], TODAY);
    expect(groups).toEqual([{ label: '2026-08-20', date: '2026-08-20', items: [a, b] }]);
  });

  test('sorts groups by date descending regardless of input order', () => {
    const older = item('a', '2026-08-01');
    const newer = item('b', '2026-08-15');
    const groups = groupByDate([older, newer], TODAY);
    expect(groups.map((group) => group.date)).toEqual(['2026-08-15', '2026-08-01']);
  });

  test('labels a group dated exactly today as "오늘"', () => {
    const a = item('a', TODAY);
    expect(groupByDate([a], TODAY)[0].label).toBe('오늘');
  });

  test('labels a group dated exactly one day before today as "어제"', () => {
    const a = item('a', '2026-08-26');
    expect(groupByDate([a], TODAY)[0].label).toBe('어제');
  });

  test('labels a group dated two days before today with the raw date string, not "어제"', () => {
    const a = item('a', '2026-08-25');
    expect(groupByDate([a], TODAY)[0].label).toBe('2026-08-25');
  });

  test('labels a future-dated group with the raw date string', () => {
    const a = item('a', '2026-08-28');
    expect(groupByDate([a], TODAY)[0].label).toBe('2026-08-28');
  });
});

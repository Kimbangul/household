import { addDaysToDateString } from './date';

export interface DateGroup<T> {
  label: string;
  date: string;
  items: T[];
}

function labelForDate(date: string, today: string): string {
  if (date === today) {
    return '오늘';
  }
  if (date === addDaysToDateString(today, -1)) {
    return '어제';
  }
  return date;
}

export function groupByDate<T extends { date: string }>(items: T[], today: string): DateGroup<T>[] {
  const sorted = [...items].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const groups: DateGroup<T>[] = [];
  for (const item of sorted) {
    const currentGroup = groups[groups.length - 1];
    if (currentGroup && currentGroup.date === item.date) {
      currentGroup.items.push(item);
    } else {
      groups.push({ label: labelForDate(item.date, today), date: item.date, items: [item] });
    }
  }
  return groups;
}

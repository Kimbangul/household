const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// setFullYear (unlike the Date(year, month, day) constructor) never applies
// the legacy 1900-offset coercion for two-digit years, so this is the only
// safe way to build a Date from an exact 4-digit calendar year.
function toDate(year: number, month: number, day: number): Date {
  const parsed = new Date(0);
  parsed.setFullYear(year, month - 1, day);
  return parsed;
}

export function isValidCalendarDate(date: string): boolean {
  const match = DATE_PATTERN.exec(date);
  if (!match) {
    return false;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = toDate(year, month, day);

  return (
    parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day
  );
}

export function addDaysToDateString(date: string, days: number): string {
  const [, yearText, monthText, dayText] = DATE_PATTERN.exec(date)!;
  const parsed = toDate(Number(yearText), Number(monthText), Number(dayText));
  parsed.setDate(parsed.getDate() + days);

  const year = String(parsed.getFullYear()).padStart(4, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

import type { Period } from './types';

export function getRecordsInPeriod<T extends { date: string }>(records: T[], period: Period): T[] {
  return records.filter((record) => record.date >= period.startDate && record.date <= period.endDate);
}

export function sumAmounts<T extends { amount: number }>(records: T[]): number {
  return records.reduce((total, record) => total + record.amount, 0);
}

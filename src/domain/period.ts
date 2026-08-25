import { addDaysToDateString, isValidCalendarDate } from './date';
import type { Period } from './types';

export interface PeriodInput {
  startDate: string;
  endDate: string;
}

export type PeriodInputField = 'startDate' | 'endDate';

export interface PeriodValidationResult {
  valid: boolean;
  errors: Partial<Record<PeriodInputField, string>>;
}

export function validatePeriodInput(input: PeriodInput): PeriodValidationResult {
  const errors: Partial<Record<PeriodInputField, string>> = {};

  if (!isValidCalendarDate(input.startDate)) {
    errors.startDate = '시작일을 입력해주세요.';
  }

  if (!isValidCalendarDate(input.endDate)) {
    errors.endDate = '종료일을 입력해주세요.';
  } else if (isValidCalendarDate(input.startDate) && input.endDate < input.startDate) {
    errors.endDate = '종료일은 시작일 이후여야 합니다.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function createPeriod(input: PeriodInput, id: string): Period {
  const validation = validatePeriodInput(input);
  if (!validation.valid) {
    throw new Error('Invalid period input: ' + Object.values(validation.errors).join(' '));
  }

  return {
    id,
    startDate: input.startDate,
    endDate: input.endDate,
    income: 0,
  };
}

export function suggestNextPeriodStartDate(periods: Period[], today: string): string {
  if (periods.length === 0) {
    return today;
  }

  const mostRecentlyAdded = periods[periods.length - 1];
  return addDaysToDateString(mostRecentlyAdded.endDate, 1);
}

export function isPastPeriod(period: Period, today: string): boolean {
  return period.endDate < today;
}

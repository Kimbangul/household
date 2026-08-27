import { isValidCalendarDate } from './date';
import type { IncomeEntry } from './types';

export interface IncomeEntryInput {
  date: string;
  item: string;
  amount: number;
  memo?: string;
}

export type IncomeEntryInputField = 'date' | 'item' | 'amount';

export interface IncomeEntryValidationResult {
  valid: boolean;
  errors: Partial<Record<IncomeEntryInputField, string>>;
}

export function validateIncomeEntryInput(input: IncomeEntryInput): IncomeEntryValidationResult {
  const errors: Partial<Record<IncomeEntryInputField, string>> = {};

  if (!isValidCalendarDate(input.date)) {
    errors.date = '날짜를 입력해주세요.';
  }

  if (input.item.trim().length === 0) {
    errors.item = '내용을 입력해주세요.';
  }

  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    errors.amount = '금액은 0보다 큰 정수여야 합니다.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function createIncomeEntry(input: IncomeEntryInput, id: string): IncomeEntry {
  const validation = validateIncomeEntryInput(input);
  if (!validation.valid) {
    throw new Error('Invalid income entry input: ' + Object.values(validation.errors).join(' '));
  }

  const entry: IncomeEntry = {
    id,
    date: input.date,
    item: input.item.trim(),
    amount: input.amount,
  };

  const trimmedMemo = input.memo?.trim();
  if (trimmedMemo) {
    entry.memo = trimmedMemo;
  }

  return entry;
}

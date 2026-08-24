import type { Expense } from './types';

export interface ExpenseInput {
  date: string;
  item: string;
  amount: number;
  categoryId: string | null;
  memo?: string;
}

export type ExpenseInputField = 'date' | 'item' | 'amount' | 'categoryId';

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<ExpenseInputField, string>>;
}

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function isValidCalendarDate(date: string): boolean {
  const match = DATE_PATTERN.exec(date);
  if (!match) {
    return false;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(year, month - 1, day);

  return (
    parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day
  );
}

export function validateExpenseInput(input: ExpenseInput): ValidationResult {
  const errors: Partial<Record<ExpenseInputField, string>> = {};

  if (!isValidCalendarDate(input.date)) {
    errors.date = '날짜를 입력해주세요.';
  }

  if (input.item.trim().length === 0) {
    errors.item = '품목을 입력해주세요.';
  }

  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    errors.amount = '금액은 0보다 큰 정수여야 합니다.';
  }

  if (!input.categoryId) {
    errors.categoryId = '카테고리를 선택해주세요.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function createExpense(input: ExpenseInput, id: string): Expense {
  const validation = validateExpenseInput(input);
  if (!validation.valid) {
    throw new Error('Invalid expense input: ' + Object.values(validation.errors).join(' '));
  }

  const expense: Expense = {
    id,
    date: input.date,
    item: input.item.trim(),
    amount: input.amount,
    categoryId: input.categoryId,
  };

  const trimmedMemo = input.memo?.trim();
  if (trimmedMemo) {
    expense.memo = trimmedMemo;
  }

  return expense;
}

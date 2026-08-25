import type { Expense, Period } from './types';

export function getExpensesInPeriod(expenses: Expense[], period: Period): Expense[] {
  return expenses.filter(
    (expense) => expense.date >= period.startDate && expense.date <= period.endDate,
  );
}

export function sumExpenseAmounts(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

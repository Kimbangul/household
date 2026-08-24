import { createExpense, validateExpenseInput, type ExpenseInput } from './expense';

const validInput: ExpenseInput = {
  date: '2026-08-24',
  item: '점심',
  amount: 12000,
  categoryId: 'default-food',
  memo: '동료와 식사',
};

describe('validateExpenseInput', () => {
  test('accepts a fully filled valid input', () => {
    expect(validateExpenseInput(validInput)).toEqual({ valid: true, errors: {} });
  });

  test('accepts a valid input with no memo', () => {
    const { memo, ...withoutMemo } = validInput;
    expect(validateExpenseInput(withoutMemo)).toEqual({ valid: true, errors: {} });
  });

  test('rejects an empty item', () => {
    const result = validateExpenseInput({ ...validInput, item: '   ' });
    expect(result.valid).toBe(false);
    expect(result.errors.item).toBeDefined();
  });

  test('rejects a non-positive amount', () => {
    const result = validateExpenseInput({ ...validInput, amount: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors.amount).toBeDefined();
  });

  test('rejects a NaN amount', () => {
    const result = validateExpenseInput({ ...validInput, amount: NaN });
    expect(result.valid).toBe(false);
    expect(result.errors.amount).toBeDefined();
  });

  test('rejects a fractional amount', () => {
    const result = validateExpenseInput({ ...validInput, amount: 12000.5 });
    expect(result.valid).toBe(false);
    expect(result.errors.amount).toBeDefined();
  });

  test('rejects an empty date', () => {
    const result = validateExpenseInput({ ...validInput, date: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.date).toBeDefined();
  });

  test('rejects a malformed date', () => {
    const result = validateExpenseInput({ ...validInput, date: '2026/08/24' });
    expect(result.valid).toBe(false);
    expect(result.errors.date).toBeDefined();
  });

  test('rejects a calendar date that does not exist', () => {
    const result = validateExpenseInput({ ...validInput, date: '2026-02-30' });
    expect(result.valid).toBe(false);
    expect(result.errors.date).toBeDefined();
  });

  test('rejects a missing category', () => {
    const result = validateExpenseInput({ ...validInput, categoryId: null });
    expect(result.valid).toBe(false);
    expect(result.errors.categoryId).toBeDefined();
  });

  test('reports every invalid field at once', () => {
    const result = validateExpenseInput({ date: '', item: '', amount: -1, categoryId: null });
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).sort()).toEqual(['amount', 'categoryId', 'date', 'item']);
  });
});

describe('createExpense', () => {
  test('builds an Expense from a valid input and the given id', () => {
    const expense = createExpense(validInput, 'expense-1');

    expect(expense).toEqual({
      id: 'expense-1',
      date: '2026-08-24',
      item: '점심',
      amount: 12000,
      categoryId: 'default-food',
      memo: '동료와 식사',
    });
  });

  test('trims the item and omits memo when not provided', () => {
    const expense = createExpense({ ...validInput, item: '  점심  ', memo: undefined }, 'expense-2');

    expect(expense.item).toBe('점심');
    expect(expense.memo).toBeUndefined();
  });

  test('trims the memo', () => {
    const expense = createExpense({ ...validInput, memo: '  동료와 식사  ' }, 'expense-4');

    expect(expense.memo).toBe('동료와 식사');
  });

  test('omits memo when it is only whitespace', () => {
    const expense = createExpense({ ...validInput, memo: '   ' }, 'expense-5');

    expect(expense.memo).toBeUndefined();
  });

  test('throws when the input is invalid', () => {
    expect(() => createExpense({ ...validInput, amount: 0 }, 'expense-3')).toThrow();
  });
});

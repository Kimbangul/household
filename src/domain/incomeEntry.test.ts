import { createIncomeEntry, validateIncomeEntryInput, type IncomeEntryInput } from './incomeEntry';

const validInput: IncomeEntryInput = {
  date: '2026-08-24',
  item: '8월 급여',
  amount: 3000000,
  memo: '세후',
};

describe('validateIncomeEntryInput', () => {
  test('accepts a fully filled valid input', () => {
    expect(validateIncomeEntryInput(validInput)).toEqual({ valid: true, errors: {} });
  });

  test('accepts a valid input with no memo', () => {
    const { memo, ...withoutMemo } = validInput;
    expect(validateIncomeEntryInput(withoutMemo)).toEqual({ valid: true, errors: {} });
  });

  test('rejects an empty item', () => {
    const result = validateIncomeEntryInput({ ...validInput, item: '   ' });
    expect(result.valid).toBe(false);
    expect(result.errors.item).toBeDefined();
  });

  test('rejects a non-positive amount', () => {
    const result = validateIncomeEntryInput({ ...validInput, amount: 0 });
    expect(result.valid).toBe(false);
    expect(result.errors.amount).toBeDefined();
  });

  test('rejects a NaN amount', () => {
    const result = validateIncomeEntryInput({ ...validInput, amount: NaN });
    expect(result.valid).toBe(false);
    expect(result.errors.amount).toBeDefined();
  });

  test('rejects a fractional amount', () => {
    const result = validateIncomeEntryInput({ ...validInput, amount: 3000000.5 });
    expect(result.valid).toBe(false);
    expect(result.errors.amount).toBeDefined();
  });

  test('rejects an empty date', () => {
    const result = validateIncomeEntryInput({ ...validInput, date: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.date).toBeDefined();
  });

  test('rejects a malformed date', () => {
    const result = validateIncomeEntryInput({ ...validInput, date: '2026/08/24' });
    expect(result.valid).toBe(false);
    expect(result.errors.date).toBeDefined();
  });

  test('rejects a calendar date that does not exist', () => {
    const result = validateIncomeEntryInput({ ...validInput, date: '2026-02-30' });
    expect(result.valid).toBe(false);
    expect(result.errors.date).toBeDefined();
  });

  test('reports every invalid field at once', () => {
    const result = validateIncomeEntryInput({ date: '', item: '', amount: -1 });
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).sort()).toEqual(['amount', 'date', 'item']);
  });
});

describe('createIncomeEntry', () => {
  test('builds an IncomeEntry from a valid input and the given id', () => {
    const entry = createIncomeEntry(validInput, 'income-1');

    expect(entry).toEqual({
      id: 'income-1',
      date: '2026-08-24',
      item: '8월 급여',
      amount: 3000000,
      memo: '세후',
    });
  });

  test('trims the item and omits memo when not provided', () => {
    const entry = createIncomeEntry({ ...validInput, item: '  8월 급여  ', memo: undefined }, 'income-2');

    expect(entry.item).toBe('8월 급여');
    expect(entry.memo).toBeUndefined();
  });

  test('trims the memo', () => {
    const entry = createIncomeEntry({ ...validInput, memo: '  세후  ' }, 'income-4');

    expect(entry.memo).toBe('세후');
  });

  test('omits memo when it is only whitespace', () => {
    const entry = createIncomeEntry({ ...validInput, memo: '   ' }, 'income-5');

    expect(entry.memo).toBeUndefined();
  });

  test('throws when the input is invalid', () => {
    expect(() => createIncomeEntry({ ...validInput, amount: 0 }, 'income-3')).toThrow();
  });
});

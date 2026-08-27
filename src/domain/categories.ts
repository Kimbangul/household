import type { Category, Expense } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'default-housing', name: '주거비', isDefault: true },
  { id: 'default-food', name: '식비', isDefault: true },
  { id: 'default-utilities', name: '공과금', isDefault: true },
  { id: 'default-transport', name: '교통', isDefault: true },
  { id: 'default-shopping', name: '쇼핑', isDefault: true },
  { id: 'default-hobby', name: '취미/여가', isDefault: true },
  { id: 'default-travel', name: '여행/숙박', isDefault: true },
  { id: 'default-gifts', name: '경조사/선물', isDefault: true },
  { id: 'default-beauty', name: '미용', isDefault: true },
  { id: 'default-health', name: '의료/건강/피트니스', isDefault: true },
  { id: 'default-education', name: '교육/도서', isDefault: true },
  { id: 'default-insurance', name: '통신/보험', isDefault: true },
  { id: 'default-etc', name: '기타', isDefault: true },
  { id: 'default-living', name: '생활비', isDefault: true },
];

export function ensureDefaultCategories(existing: Category[]): Category[] {
  if (existing.length > 0) {
    return existing;
  }
  return [...DEFAULT_CATEGORIES];
}

export interface CategoryInput {
  name: string;
}

export type CategoryInputField = 'name';

export interface CategoryValidationResult {
  valid: boolean;
  errors: Partial<Record<CategoryInputField, string>>;
}

export function validateCategoryInput(input: CategoryInput): CategoryValidationResult {
  const errors: Partial<Record<CategoryInputField, string>> = {};
  if (input.name.trim().length === 0) {
    errors.name = '카테고리 이름을 입력해주세요.';
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

export function createCategory(input: CategoryInput, id: string): Category {
  const validation = validateCategoryInput(input);
  if (!validation.valid) {
    throw new Error('Invalid category input: ' + Object.values(validation.errors).join(' '));
  }
  return { id, name: input.name.trim(), isDefault: false };
}

// A cross-record check (unlike validateCategoryInput's single-field shape
// check), so it's a separate function the caller combines with validation
// rather than a parameter on createCategory/validateCategoryInput.
export function isDuplicateCategoryName(name: string, categories: Category[]): boolean {
  const trimmed = name.trim();
  return categories.some((category) => category.name === trimmed);
}

export function canDeleteCategory(category: Category): boolean {
  return !category.isDefault;
}

export function reclassifyExpensesForDeletedCategory(expenses: Expense[], categoryId: string): Expense[] {
  return expenses.map((expense) =>
    expense.categoryId === categoryId ? { ...expense, categoryId: null } : expense,
  );
}

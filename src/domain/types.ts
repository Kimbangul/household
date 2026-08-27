export interface Category {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface Expense {
  id: string;
  date: string;
  item: string;
  amount: number;
  categoryId: string | null;
  memo?: string;
}

export interface Period {
  id: string;
  startDate: string;
  endDate: string;
}

export interface IncomeEntry {
  id: string;
  date: string;
  item: string;
  amount: number;
  memo?: string;
}

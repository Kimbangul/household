import type { Category } from './types';

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

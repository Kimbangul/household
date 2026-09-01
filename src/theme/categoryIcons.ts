import type { ComponentType } from 'react';

import {
  BeautyIcon,
  CommunicationIcon,
  EducationIcon,
  FoodIcon,
  GiftIcon,
  HousingIcon,
  LeisureIcon,
  LivingIcon,
  MedicalIcon,
  OtherIcon,
  ShoppingIcon,
  TrafficIcon,
  TravelIcon,
  UtilityIcon,
} from '../components/icons/CategoryIcons';

export interface CategoryIconProps {
  color: string;
  size?: number;
}

// Keyed by the fixed ids in src/domain/categories.ts's DEFAULT_CATEGORIES —
// every one of the app's 14 built-in categories has exactly one matching
// icon (src/assets/icon/*.svg, minus the unused beer.svg with no category
// match). A user-added category has no entry here on purpose: only default
// categories get an icon, per the "기본 카테고리는 아이콘, 사용자가 추가한
// 카테고리는 맨 앞글자" decision — CategoryIconChip falls back to the
// initial-letter chip for any id (custom or the null/미분류 case) not
// listed below.
const DEFAULT_CATEGORY_ICONS: Record<string, ComponentType<CategoryIconProps>> = {
  'default-housing': HousingIcon,
  'default-food': FoodIcon,
  'default-utilities': UtilityIcon,
  'default-transport': TrafficIcon,
  'default-shopping': ShoppingIcon,
  'default-hobby': LeisureIcon,
  'default-travel': TravelIcon,
  'default-gifts': GiftIcon,
  'default-beauty': BeautyIcon,
  'default-health': MedicalIcon,
  'default-education': EducationIcon,
  'default-insurance': CommunicationIcon,
  'default-etc': OtherIcon,
  'default-living': LivingIcon,
};

export function getCategoryIcon(categoryId: string | null): ComponentType<CategoryIconProps> | undefined {
  if (categoryId === null) {
    return undefined;
  }
  return DEFAULT_CATEGORY_ICONS[categoryId];
}

import styled from 'styled-components/native';

import type { Category } from '../domain/types';

export function CategoryChipPicker({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <CategoryList>
      {categories.map((category) => (
        <CategoryChip
          key={category.id}
          onPress={() => onSelect(category.id)}
          $selected={selectedId === category.id}
        >
          <CategoryChipText $selected={selectedId === category.id}>{category.name}</CategoryChipText>
        </CategoryChip>
      ))}
    </CategoryList>
  );
}

const CategoryList = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
`;

const CategoryChip = styled.Pressable<{ $selected: boolean }>`
  border-width: 1px;
  border-radius: 16px;
  padding-vertical: 6px;
  padding-horizontal: 12px;
  border-color: ${(props) => (props.$selected ? props.theme.primary : props.theme.border)};
  background-color: ${(props) => (props.$selected ? props.theme.primary : 'transparent')};
`;

const CategoryChipText = styled.Text<{ $selected: boolean }>`
  color: ${(props) => (props.$selected ? props.theme.onPrimary : props.theme.text)};
  font-family: ${(props) => props.theme.fontRegular};
`;

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

// Matches the design system's "Tab / Active-Disable" chip: filled background,
// no border. Inactive uses the dedicated chipSurface token (not
// background/card) since this picker renders both directly on the screen and
// nested inside a white RowCard — a plain background/card fill would
// disappear into whichever one it happened to match.
const CategoryChip = styled.Pressable<{ $selected: boolean }>`
  border-radius: 15px;
  padding-vertical: 8px;
  padding-horizontal: 14px;
  background-color: ${(props) => (props.$selected ? props.theme.primary : props.theme.chipSurface)};
`;

const CategoryChipText = styled.Text<{ $selected: boolean }>`
  font-size: 14px;
  line-height: 20px;
  color: ${(props) => (props.$selected ? props.theme.onPrimary : props.theme.text)};
  font-family: ${(props) => props.theme.fontMedium};
`;

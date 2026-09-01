import styled, { useTheme } from 'styled-components/native';

import type { Category } from '../domain/types';
import { getCategoryChipColor } from '../theme/categoryChip';
import { withAlpha } from '../theme/withAlpha';

export function CategoryChipPicker({
  categories,
  selectedId,
  onSelect,
}: {
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const theme = useTheme();

  return (
    <CategoryList>
      {categories.map((category) => {
        const selected = selectedId === category.id;
        const dotColor = getCategoryChipColor(category.id);
        return (
          <CategoryChip
            key={category.id}
            onPress={() => onSelect(category.id)}
            $selected={selected}
            style={{
              backgroundColor: selected ? theme.primary : theme.background,
              boxShadow: selected ? `0px 6px 16px -4px ${withAlpha(theme.primary, 0.35)}` : theme.insetShadow,
            }}
          >
            <CategoryDot style={{ backgroundColor: selected ? theme.onPrimary : dotColor }} />
            <CategoryChipText $selected={selected}>{category.name}</CategoryChipText>
          </CategoryChip>
        );
      })}
    </CategoryList>
  );
}

const CategoryList = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
`;

// Unselected chips read as neumorphic pills sitting in the background well
// (inset shadow, no border); a selected chip fills with the single
// `theme.primary`/`theme.onPrimary` pair (same as every other selection
// control in the app) rather than that category's own hashed color — the
// hash palette only has 6 entries against this app's 14 default categories,
// so per-category fills here would collide and, on the lighter entries,
// wouldn't contrast reliably against white text. The small dot still shows
// the category's hashed color as a lightweight (non-load-bearing) hint.
// backgroundColor/boxShadow are computed per-chip and passed via `style`
// above rather than this `css` template — styled-components/native's CSS
// parser doesn't recognize the `box-shadow` declaration and throws at
// runtime (see the note atop styledPrimitives.tsx).
const CategoryChip = styled.Pressable<{ $selected: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  border-radius: 20px;
  padding-vertical: 8px;
  padding-horizontal: 14px;
`;

const CategoryDot = styled.View`
  width: 8px;
  height: 8px;
  border-radius: 4px;
`;

const CategoryChipText = styled.Text<{ $selected: boolean }>`
  font-size: 13px;
  line-height: 18px;
  color: ${(props) => (props.$selected ? props.theme.onPrimary : props.theme.text)};
  font-family: ${(props) => props.theme.fontBold};
`;

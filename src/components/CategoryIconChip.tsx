import styled from 'styled-components/native';

import { getCategoryIcon } from '../theme/categoryIcons';
import { withAlpha } from '../theme/withAlpha';

// Soft-modern "cat-icon-box": a flat rounded-square tinted at ~10% of the
// category color, with either an icon or the initial drawn in the
// full-strength color — replaces the previous solid-fill-plus-white-text
// chip. A default category (`categoryId` matches one of DEFAULT_CATEGORIES)
// gets its dedicated icon; a custom category, the null/미분류 case, or a
// non-category caller (e.g. IncomeEntryEditRow's fixed "수" marker, which
// passes no categoryId at all) falls back to the initial letter.
export function CategoryIconChip({
  color,
  initial,
  categoryId,
  size = 'standalone',
}: {
  color: string;
  initial: string;
  categoryId?: string | null;
  size?: 'compact' | 'standalone';
}) {
  const Icon = categoryId !== undefined ? getCategoryIcon(categoryId) : undefined;
  const iconSize = size === 'compact' ? 18 : 22;

  return (
    <ChipBox $size={size} style={{ backgroundColor: withAlpha(color, 0.1) }}>
      {Icon ? (
        <Icon color={color} size={iconSize} />
      ) : (
        <ChipText $size={size} style={{ color }}>
          {initial}
        </ChipText>
      )}
    </ChipBox>
  );
}

const ChipBox = styled.View<{ $size: 'compact' | 'standalone' }>`
  width: ${(props) => (props.$size === 'compact' ? '36px' : '45px')};
  height: ${(props) => (props.$size === 'compact' ? '36px' : '45px')};
  border-radius: 14px;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
`;

const ChipText = styled.Text<{ $size: 'compact' | 'standalone' }>`
  font-size: ${(props) => (props.$size === 'compact' ? '13px' : '16px')};
  font-family: ${(props) => props.theme.fontBold};
`;

import styled from 'styled-components/native';

import { withAlpha } from '../theme/withAlpha';

// Soft-modern "cat-icon-box": a flat rounded-square tinted at ~10% of the
// category color, with the initial drawn in the full-strength color —
// replaces the previous solid-fill-plus-white-text chip.
export function CategoryIconChip({
  color,
  initial,
  size = 'standalone',
}: {
  color: string;
  initial: string;
  size?: 'compact' | 'standalone';
}) {
  return (
    <ChipBox $size={size} style={{ backgroundColor: withAlpha(color, 0.1) }}>
      <ChipText $size={size} style={{ color }}>
        {initial}
      </ChipText>
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

import styled from 'styled-components/native';

export function CategoryIconChip({
  color,
  initial,
  size = 'standalone',
  textColor = '#ffffff',
}: {
  color: string;
  initial: string;
  size?: 'compact' | 'standalone';
  // Defaults to white, which is correct for the always-saturated
  // CATEGORY_CHIP_COLORS palette. A caller passing a theme color instead
  // (e.g. theme.primary, which is a light lavender in dark mode) must pass
  // the matching theme.onPrimary here to keep the initial readable.
  textColor?: string;
}) {
  return (
    <ChipBox $size={size} style={{ backgroundColor: color }}>
      <ChipText $size={size} style={{ color: textColor }}>
        {initial}
      </ChipText>
    </ChipBox>
  );
}

const ChipBox = styled.View<{ $size: 'compact' | 'standalone' }>`
  width: ${(props) => (props.$size === 'compact' ? '28px' : '36px')};
  height: ${(props) => (props.$size === 'compact' ? '28px' : '36px')};
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  shadow-color: #000000;
  shadow-offset: 0px 5px;
  shadow-opacity: 0.05;
  shadow-radius: 12px;
  elevation: 2;
`;

const ChipText = styled.Text<{ $size: 'compact' | 'standalone' }>`
  font-size: ${(props) => (props.$size === 'compact' ? '12px' : '14px')};
  font-family: ${(props) => props.theme.fontSemiBold};
`;

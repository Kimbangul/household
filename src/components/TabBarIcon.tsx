import styled from 'styled-components/native';

// Soft-modern bottom nav: label always visible under the icon (not just on
// the active tab), active tab gets bold + primary color, inactive stays
// regular weight + muted — no pill/background fill, unlike the previous
// iBank-style active-pill treatment.
export function TabBarIcon({
  focused,
  label,
  children,
}: {
  focused: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Stack>
      {children}
      <Label
        $focused={focused}
        numberOfLines={1}
        ellipsizeMode="tail"
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {label}
      </Label>
    </Stack>
  );
}

const Stack = styled.View`
  align-items: center;
  gap: 4px;
  padding-vertical: 6px;
`;

const Label = styled.Text<{ $focused: boolean }>`
  font-size: 11px;
  line-height: 14px;
  letter-spacing: 0.3px;
  color: ${(props) => (props.$focused ? props.theme.primary : props.theme.textMuted)};
  font-family: ${(props) => (props.$focused ? props.theme.fontBold : props.theme.fontRegular)};
`;

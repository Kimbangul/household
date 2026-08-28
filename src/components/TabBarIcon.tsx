import styled from 'styled-components/native';

// Mirrors the iBank kit's "Tab bar / Home" active state: the focused tab
// grows into a rounded pill (brand-color fill, white icon + label); every
// other tab shows just the outline icon in a muted color, no label.
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
    <Pill $focused={focused}>
      {children}
      {focused ? <PillLabel>{label}</PillLabel> : null}
    </Pill>
  );
}

const Pill = styled.View<{ $focused: boolean }>`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding-horizontal: ${(props) => (props.$focused ? '14px' : '10px')};
  padding-vertical: 8px;
  border-radius: 20px;
  background-color: ${(props) => (props.$focused ? props.theme.primary : 'transparent')};
`;

const PillLabel = styled.Text`
  font-size: 12px;
  line-height: 16px;
  color: ${(props) => props.theme.onPrimary};
  font-family: ${(props) => props.theme.fontRegular};
`;

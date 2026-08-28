import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

// Default bottom-tab buttons all get equal flex width, which isn't enough
// room for the focused tab's one-line label (e.g. "기간별 지출") once its
// pill grows to fit icon + text. Grows the focused tab's share of the row
// while leaving the other (icon-only) tabs their normal share.
export function FlexTabButton({
  children,
  onPress,
  onLongPress,
  style,
  accessibilityState,
  testID,
}: {
  children: React.ReactNode;
  onPress?: ((event: any) => void) | null;
  onLongPress?: ((event: any) => void) | null;
  style?: StyleProp<ViewStyle>;
  accessibilityState?: { selected?: boolean };
  testID?: string;
}) {
  const focused = accessibilityState?.selected ?? false;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      testID={testID}
      accessibilityState={accessibilityState}
      style={[style, { flex: focused ? 1.8 : 1, alignItems: 'center', justifyContent: 'center' }]}
    >
      {children}
    </Pressable>
  );
}

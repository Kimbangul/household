import { forwardRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  TextInput,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import styled, { css, useTheme } from 'styled-components/native';

import { withAlpha } from './withAlpha';

// Card's own corner radius, exported so a full-bleed child that must match
// Card's rounded silhouette (Card intentionally has no `overflow: hidden` —
// see the note on ComparisonBox in app/index.tsx) can derive its own corner
// radius from this instead of a second hardcoded 18.
export const CARD_RADIUS = 18;

// Shared across every screen/form: only components whose CSS is byte-for-byte
// identical in at least two files live here. A component that looks similar
// but differs even slightly (margin, alignment) stays local to its file —
// forcing those together would either change one screen's appearance or
// require prop-driven overrides for a one-off difference, which is worse
// than the duplication it would remove.
//
// `boxShadow` (RN's spec-compliant CSS box-shadow, New Architecture) is a
// valid style prop, but styled-components/native's CSS-template parser
// doesn't recognize the `box-shadow`/`boxShadow` declaration and throws
// "Failed to parse declaration" at runtime — so every shadow below is built
// as a plain style object via `useTheme()` and merged onto the component's
// `style` prop, never written inside a styled `css` template.

export const Screen = styled(ScrollView)`
  background-color: ${(props) => props.theme.background};
`;

const CardBase = styled.View`
  background-color: ${(props) => props.theme.card};
  border-radius: ${CARD_RADIUS}px;
  border-width: 1px;
  border-color: ${(props) => props.theme.border};
  padding: 16px;
`;

// The floating-card look every card-shaped container in the app shares
// (form cards, period cards, settings groups): card-colored fill, a hairline
// border, rounded 18px corners, and the soft outer shadow. Callers that need
// different padding/margin extend this with `styled(Card)`, matching how
// SectionHeading extends Heading below — `styled()` on a custom component
// forwards its computed style via the `style` prop, which this merges with
// the boxShadow object underneath it.
export function Card({ style, ...rest }: ViewProps) {
  const theme = useTheme();
  return <CardBase style={[{ boxShadow: theme.cardShadow }, style]} {...rest} />;
}

// A Card with no internal padding, for wrapping a list of rows that provide
// their own horizontal padding and divide themselves with a border-bottom
// (e.g. FlatRow in editRowPrimitives.ts, or settings.tsx's category list).
export const ListCard = styled(Card)`
  padding: 0px;
`;

// The "divider under every row but the last" convention shared by every
// row-list in the app (FlatRow in editRowPrimitives.ts, PeriodRow in
// app/index.tsx, Row in app/settings.tsx) — those three components differ
// enough in their own layout (padding, flex alignment) to stay local per the
// byte-for-byte-identical rule above, but this specific border logic is
// identical across all of them, so only it is shared. Mix into any
// `styled.View<{ $last: boolean }>` (or a type extending it) with `${dividerBottom}`.
export const dividerBottom = css<{ $last: boolean }>`
  border-bottom-width: ${(props) => (props.$last ? '0px' : '1px')};
  border-bottom-color: ${(props) => props.theme.border};
`;

// Doubles as the first section label on every screen ("최근 기간 대비 지출",
// "새 기간 추가", "화면 설정") — small uppercase tracked-out caps in the
// soft-modern reference, not a large title (the screen's own big title is
// the native nav header above it, already styled via headerTitleStyle).
export const Heading = styled.Text`
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${(props) => props.theme.textMuted};
  font-family: ${(props) => props.theme.fontSemiBold};
`;

export const SectionHeading = styled(Heading)`
  margin-top: 28px;
  margin-bottom: 12px;
`;

export const DateGroupHeading = styled.Text`
  font-size: 12px;
  line-height: 16px;
  margin-top: 16px;
  margin-bottom: 8px;
  color: ${(props) => props.theme.textMuted};
  font-family: ${(props) => props.theme.fontSemiBold};
`;

export const FieldLabel = styled.Text`
  font-size: 12px;
  line-height: 20px;
  margin-top: 12px;
  color: ${(props) => props.theme.text};
  font-family: ${(props) => props.theme.fontBold};
`;

// Neumorphic "pressed into the background" input: no border, background
// matches the screen so the inset shadow reads as a carved-out well, with a
// primary-tinted ring swapped in on focus. A plain `styled(TextInput)` can't
// react to focus, so this wraps one in a component that tracks focus state
// itself and computes the boxShadow style object directly (see the note atop
// this file on why it can't live in the `css` template); `style` is
// forwarded so `styled(FieldInput)` (see MemoInput below) still works, and
// the ref is forwarded to the underlying TextInput so callers can still
// imperatively `.focus()` it like the plain `styled(TextInput)` this
// replaced.
const StyledFieldInput = styled(TextInput)`
  border-radius: 14px;
  padding: 12px;
  margin-top: 4px;
  background-color: ${(props) => props.theme.background};
  color: ${(props) => props.theme.text};
  font-family: ${(props) => props.theme.fontMedium};
  font-size: 14px;
`;

export const FieldInput = forwardRef<TextInput, TextInputProps>(function FieldInput(
  { onFocus, onBlur, style, placeholderTextColor, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const theme = useTheme();
  return (
    <StyledFieldInput
      ref={ref}
      style={[{ boxShadow: focused ? theme.insetShadowFocus : theme.insetShadow }, style]}
      // Faded to 50% of the regular muted-text color so a placeholder never
      // reads as loud as real input text or a field label — callers don't
      // need to pass this themselves.
      placeholderTextColor={placeholderTextColor ?? withAlpha(theme.textMuted, 0.5)}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        setFocused(false);
        onBlur?.(event);
      }}
      {...rest}
    />
  );
});

export const MemoInput = styled(FieldInput)`
  min-height: 60px;
  text-align-vertical: top;
`;

export const FieldError = styled.Text`
  margin-top: 4px;
  color: ${(props) => props.theme.danger};
  font-family: ${(props) => props.theme.fontRegular};
`;

export const EmptyText = styled.Text`
  color: ${(props) => props.theme.textMuted};
  font-family: ${(props) => props.theme.fontRegular};
`;

// A small rounded status pill (e.g. "진행 중" on an ongoing period, "기본" on
// a built-in category) — 'primary' is the filled/emphasized tone, 'muted'
// the quiet/neutral one. Each screen owns its own copy/condition for when to
// show it, since that logic differs per screen; only the visual atom is shared.
export const Badge = styled.Text<{ $tone: 'primary' | 'muted' }>`
  font-size: 10px;
  line-height: 14px;
  padding-vertical: 2px;
  padding-horizontal: 8px;
  border-radius: 999px;
  color: ${(props) => (props.$tone === 'primary' ? props.theme.onPrimary : props.theme.textMuted)};
  background-color: ${(props) => (props.$tone === 'primary' ? props.theme.primary : props.theme.chipSurface)};
  font-family: ${(props) => props.theme.fontBold};
`;

const SubmitButtonBase = styled(Pressable)`
  margin-top: 24px;
  border-radius: 14px;
  padding-vertical: 14px;
  align-items: center;
  background-color: ${(props) => props.theme.primary};
`;

// No caller passes a function-form `style` (the animated-pressed-state
// variant Pressable supports), so it's narrowed to the plain form here to
// keep the boxShadow merge below simple.
export function SubmitButton({
  style,
  ...rest
}: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <SubmitButtonBase
      style={[{ boxShadow: `0px 8px 20px -4px ${withAlpha(theme.primary, 0.35)}` }, style]}
      {...rest}
    />
  );
}

export const SubmitButtonText = styled.Text`
  color: ${(props) => props.theme.onPrimary};
  font-size: 14px;
  line-height: 20px;
  font-family: ${(props) => props.theme.fontBold};
`;

export const StatusSuccessText = styled.Text`
  margin-top: 12px;
  text-align: center;
  font-size: 12px;
  line-height: 16px;
  color: ${(props) => props.theme.success};
  font-family: ${(props) => props.theme.fontRegular};
`;

export const StatusErrorText = styled.Text`
  margin-top: 12px;
  text-align: center;
  font-size: 12px;
  line-height: 16px;
  color: ${(props) => props.theme.danger};
  font-family: ${(props) => props.theme.fontRegular};
`;

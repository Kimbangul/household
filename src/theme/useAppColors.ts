import { useTheme } from 'expo-router';

// expo-router's Theme only carries navigation-chrome colors (primary,
// background, card, text, border, notification). This adds the handful of
// semantic colors (muted text, danger, success, button-on-primary) every
// screen in this app already used as hardcoded hex values, picked per mode
// so they still read clearly against each theme's background, plus the five
// loaded font family names used everywhere text is rendered.
//
// Every color field is a plain string, not RN's ColorValue: ColorValue's
// OpaqueColorValue variant (PlatformColor()/DynamicColorIOS()) can't be used
// as a value inside a styled-components template interpolation. expo-router's
// DefaultTheme/DarkTheme only ever produce plain "rgb(...)" strings, so the
// narrowing cast below is safe.
export interface AppColors {
  background: string;
  card: string;
  chipSurface: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  onPrimary: string;
  danger: string;
  success: string;
  fontRegular: string;
  fontMedium: string;
  fontSemiBold: string;
  fontBold: string;
  fontExtraBold: string;
  // Soft-modern/neumorphic design tokens (Figma Make file
  // W76A7WxIZPPylqS6lqL5Js): a floating-card outer shadow and a pressed-in
  // inset shadow for form inputs, as full CSS `box-shadow` strings. RN's
  // `boxShadow` (New Architecture, always on since RN 0.82) is a
  // spec-compliant CSS box-shadow implementation, `inset` included, so no
  // extra native dependency is needed for either shadow — but
  // styled-components/native's `css` template parser does NOT recognize the
  // `box-shadow` declaration and throws "Failed to parse declaration" at
  // runtime if one appears inside a styled template. Every consumer must
  // instead merge `{ boxShadow: theme.cardShadow }` onto a component's
  // `style` prop (see the pattern documented atop styledPrimitives.tsx).
  cardShadow: string;
  insetShadow: string;
  insetShadowFocus: string;
}

// Font family names must match the keys passed to useFonts() in app/_layout.tsx.
const FONT_REGULAR = 'Pretendard-Regular';
const FONT_MEDIUM = 'Pretendard-Medium';
const FONT_SEMIBOLD = 'Pretendard-SemiBold';
const FONT_BOLD = 'Pretendard-Bold';
const FONT_EXTRABOLD = 'Pretendard-ExtraBold';

// React Navigation's default background/card/text/border are a neutral
// gray/black-and-white theme, not this app's own soft-modern surfaces — these
// override theme.colors.background/card/text/border rather than passing them
// through, same reasoning the kit's overrides already used before this
// palette existed.
//
// Palette source: Figma Make file W76A7WxIZPPylqS6lqL5Js ("소프트 모던 / 살짝
// 뉴모피즘" reskin) — an almost-white, warm-tinted neutral base instead of the
// previous deep-navy/indigo-tinted one. `primary`/`danger`/`success` below are
// deliberately NOT taken from that file: this app keeps its existing indigo
// primary and red/teal expense/income colors, adopting only the new
// palette's layout/shape language (radius, shadow, neutrals).
const LIGHT_BACKGROUND = '#f4f4f8';
const LIGHT_CARD = '#fefefe';
const LIGHT_BORDER = '#efeff1';
const LIGHT_TEXT = '#303048';
const DARK_BACKGROUND = '#1a1b2e';
const DARK_CARD = '#242540';
const DARK_BORDER = '#35365a';
const DARK_TEXT = '#e8e8f4';

// A category chip (CategoryChipPicker) can sit directly on the screen
// background OR nested inside a card, so it needs its own filled surface
// distinct from both `background` and `card` — otherwise an inactive chip
// disappears into whichever one it happens to be filled the same as. Reuses
// the new palette's own muted-fill tone instead of a bespoke color.
const LIGHT_CHIP_SURFACE = '#ededf2';
const DARK_CHIP_SURFACE = '#2a2b45';

// Soft floating-card shadow (rgba tuned to sit on the light/dark neutrals
// above) and neumorphic pressed-in input shadow, both as ready-to-use CSS
// `box-shadow` strings — see the `cardShadow`/`insetShadow` doc comment on
// `AppColors` for why these are plain strings rather than RN's older
// shadow-color/-offset/-opacity/-radius props.
const LIGHT_CARD_SHADOW =
  '0px 20px 32px -10px rgba(34, 24, 63, 0.06), 0px 4px 12px -2px rgba(34, 24, 63, 0.04)';
const DARK_CARD_SHADOW =
  '0px 20px 32px -10px rgba(0, 0, 0, 0.28), 0px 4px 12px -2px rgba(0, 0, 0, 0.15)';
const LIGHT_INSET_SHADOW =
  'inset 2px 2px 5px rgba(174, 174, 192, 0.35), inset -2px -2px 5px rgba(255, 255, 255, 0.85)';
const DARK_INSET_SHADOW =
  'inset 2px 2px 6px rgba(0, 0, 0, 0.35), inset -2px -2px 5px rgba(60, 62, 95, 0.55)';
const LIGHT_INSET_SHADOW_FOCUS = `${LIGHT_INSET_SHADOW}, 0 0 0 2px rgba(54, 41, 183, 0.25)`;
const DARK_INSET_SHADOW_FOCUS = `${DARK_INSET_SHADOW}, 0 0 0 2px rgba(180, 169, 245, 0.3)`;

// Indigo/purple brand palette, adapted from a banking-app UI kit's visual
// language (see commit message for the reference). Dark mode's primary is a
// lighter lavender tint with dark text on it, mirroring how the previous
// neutral palette paired a light dark-mode primary with dark onPrimary text —
// a mid-tone purple with white text would fail contrast against a near-black
// background. danger/success stay close to the same hex in both modes since
// they're already saturated enough to read on either background.
const DARK_EXTRAS = {
  textMuted: '#8888a0',
  primary: '#b4a9f5',
  onPrimary: '#1e1b3a',
  danger: '#ff6b85',
  success: '#6fe0c8',
  fontRegular: FONT_REGULAR,
  fontMedium: FONT_MEDIUM,
  fontSemiBold: FONT_SEMIBOLD,
  fontBold: FONT_BOLD,
  fontExtraBold: FONT_EXTRABOLD,
  cardShadow: DARK_CARD_SHADOW,
  insetShadow: DARK_INSET_SHADOW,
  insetShadowFocus: DARK_INSET_SHADOW_FOCUS,
};

const LIGHT_EXTRAS = {
  textMuted: '#67677a',
  primary: '#3629b7',
  onPrimary: '#ffffff',
  danger: '#ff4267',
  success: '#52d5ba',
  fontRegular: FONT_REGULAR,
  fontMedium: FONT_MEDIUM,
  fontSemiBold: FONT_SEMIBOLD,
  fontBold: FONT_BOLD,
  fontExtraBold: FONT_EXTRABOLD,
  cardShadow: LIGHT_CARD_SHADOW,
  insetShadow: LIGHT_INSET_SHADOW,
  insetShadowFocus: LIGHT_INSET_SHADOW_FOCUS,
};

export function useAppColors(): AppColors {
  const theme = useTheme();
  const extras = theme.dark ? DARK_EXTRAS : LIGHT_EXTRAS;

  return {
    background: theme.dark ? DARK_BACKGROUND : LIGHT_BACKGROUND,
    card: theme.dark ? DARK_CARD : LIGHT_CARD,
    chipSurface: theme.dark ? DARK_CHIP_SURFACE : LIGHT_CHIP_SURFACE,
    text: theme.dark ? DARK_TEXT : LIGHT_TEXT,
    border: theme.dark ? DARK_BORDER : LIGHT_BORDER,
    ...extras,
  };
}

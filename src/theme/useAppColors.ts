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
}

// Font family names must match the keys passed to useFonts() in app/_layout.tsx.
const FONT_REGULAR = 'Pretendard-Regular';
const FONT_MEDIUM = 'Pretendard-Medium';
const FONT_SEMIBOLD = 'Pretendard-SemiBold';
const FONT_BOLD = 'Pretendard-Bold';
const FONT_EXTRABOLD = 'Pretendard-ExtraBold';

// React Navigation's default background/card (#F2F2F2 / #FFFFFF) are neutral
// gray, not the kit's own indigo-tinted surfaces — the reference design's
// "Payment history" screen keeps the whole screen (chrome included) on a
// light lavender backdrop so the white per-row cards visibly pop, so these
// override theme.colors.background/card rather than passing them through.
const LIGHT_BACKGROUND = '#F2F1F9';
const LIGHT_CARD = '#ffffff';
const DARK_BACKGROUND = '#131024';
const DARK_CARD = '#1e1b36';

// A category chip (CategoryChipPicker) can sit directly on the screen
// background OR nested inside a white RowCard, so it needs its own filled
// surface distinct from both `background` and `card` — otherwise an inactive
// chip disappears into whichever one it happens to be filled the same as.
// This is the same light-lavender family as `background`, just a step more
// saturated so it still reads against it (matches the kit's inactive
// "Tab / Disable" fill, #F2F1F9, kept as a dedicated token instead of reusing
// `background` for a different role).
const LIGHT_CHIP_SURFACE = '#E4DEF7';
const DARK_CHIP_SURFACE = '#2b2650';

// Indigo/purple brand palette, adapted from a banking-app UI kit's visual
// language (see commit message for the reference). Dark mode's primary is a
// lighter lavender tint with dark text on it, mirroring how the previous
// neutral palette paired a light dark-mode primary with dark onPrimary text —
// a mid-tone purple with white text would fail contrast against a near-black
// background. danger/success stay close to the same hex in both modes since
// they're already saturated enough to read on either background.
const DARK_EXTRAS = {
  textMuted: '#a5a5c0',
  primary: '#b4a9f5',
  onPrimary: '#1e1b3a',
  danger: '#ff6b85',
  success: '#6fe0c8',
  fontRegular: FONT_REGULAR,
  fontMedium: FONT_MEDIUM,
  fontSemiBold: FONT_SEMIBOLD,
  fontBold: FONT_BOLD,
  fontExtraBold: FONT_EXTRABOLD,
};

const LIGHT_EXTRAS = {
  textMuted: '#8d8da6',
  primary: '#3629b7',
  onPrimary: '#ffffff',
  danger: '#ff4267',
  success: '#52d5ba',
  fontRegular: FONT_REGULAR,
  fontMedium: FONT_MEDIUM,
  fontSemiBold: FONT_SEMIBOLD,
  fontBold: FONT_BOLD,
  fontExtraBold: FONT_EXTRABOLD,
};

export function useAppColors(): AppColors {
  const theme = useTheme();
  const extras = theme.dark ? DARK_EXTRAS : LIGHT_EXTRAS;

  return {
    background: theme.dark ? DARK_BACKGROUND : LIGHT_BACKGROUND,
    card: theme.dark ? DARK_CARD : LIGHT_CARD,
    chipSurface: theme.dark ? DARK_CHIP_SURFACE : LIGHT_CHIP_SURFACE,
    text: theme.colors.text as string,
    border: theme.colors.border as string,
    ...extras,
  };
}

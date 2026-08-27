import { useTheme } from 'expo-router';

// expo-router's Theme only carries navigation-chrome colors (primary,
// background, card, text, border, notification). This adds the handful of
// semantic colors (muted text, danger, success, button-on-primary) every
// screen in this app already used as hardcoded hex values, picked per mode
// so they still read clearly against each theme's background, plus the two
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
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  onPrimary: string;
  danger: string;
  success: string;
  fontRegular: string;
  fontSemiBold: string;
}

// Font family names must match the keys passed to useFonts() in app/_layout.tsx.
const FONT_REGULAR = 'NotoSansKR_400Regular';
const FONT_SEMIBOLD = 'NotoSansKR_600SemiBold';

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
  fontSemiBold: FONT_SEMIBOLD,
};

const LIGHT_EXTRAS = {
  textMuted: '#8d8da6',
  primary: '#3629b7',
  onPrimary: '#ffffff',
  danger: '#ff4267',
  success: '#52d5ba',
  fontRegular: FONT_REGULAR,
  fontSemiBold: FONT_SEMIBOLD,
};

export function useAppColors(): AppColors {
  const theme = useTheme();
  const extras = theme.dark ? DARK_EXTRAS : LIGHT_EXTRAS;

  return {
    background: theme.colors.background as string,
    card: theme.colors.card as string,
    text: theme.colors.text as string,
    border: theme.colors.border as string,
    ...extras,
  };
}

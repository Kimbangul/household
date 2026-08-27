import { useTheme } from 'expo-router';
import type { ColorValue } from 'react-native';

// expo-router's Theme only carries navigation-chrome colors (primary,
// background, card, text, border, notification). This adds the handful of
// semantic colors (muted text, danger, success, button-on-primary) every
// screen in this app already used as hardcoded hex values, picked per mode
// so they still read clearly against each theme's background.
export interface AppColors {
  background: ColorValue;
  card: ColorValue;
  text: ColorValue;
  textMuted: string;
  border: ColorValue;
  primary: string;
  onPrimary: string;
  danger: string;
  success: string;
}

const DARK_EXTRAS = {
  textMuted: '#a0a0a0',
  primary: '#e0e0e0',
  onPrimary: '#121212',
  danger: '#ff6b6b',
  success: '#4caf50',
};

const LIGHT_EXTRAS = {
  textMuted: '#888888',
  primary: '#333333',
  onPrimary: '#ffffff',
  danger: '#d33333',
  success: '#2a7d2a',
};

export function useAppColors(): AppColors {
  const theme = useTheme();
  const extras = theme.dark ? DARK_EXTRAS : LIGHT_EXTRAS;

  return {
    background: theme.colors.background,
    card: theme.colors.card,
    text: theme.colors.text,
    border: theme.colors.border,
    ...extras,
  };
}

export interface Settings {
  darkMode: boolean;
}

export const DEFAULT_SETTINGS: Settings = { darkMode: false };

export function toggleDarkMode(settings: Settings): Settings {
  return { ...settings, darkMode: !settings.darkMode };
}

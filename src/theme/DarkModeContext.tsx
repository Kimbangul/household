import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { DEFAULT_SETTINGS, toggleDarkMode as toggleDarkModeSetting, type Settings } from '../domain/settings';
import { useRepository } from '../storage/RepositoryContext';

interface DarkModeContextValue {
  isDarkMode: boolean;
  toggleDarkMode: () => Promise<void>;
}

const DarkModeContext = createContext<DarkModeContextValue | null>(null);

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const repository = useRepository();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    repository
      .getSettings()
      .then((loaded) => {
        if (!cancelled) {
          setSettings(loaded);
        }
      })
      .catch((error) => {
        console.error('Failed to load settings', error);
      })
      .finally(() => {
        if (!cancelled) {
          setIsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [repository]);

  async function toggleDarkMode() {
    const next = toggleDarkModeSetting(settings);
    try {
      await repository.saveSettings(next);
      setSettings(next);
    } catch (error) {
      console.error('Failed to save settings', error);
    }
  }

  if (!isReady) {
    return null;
  }

  return (
    <DarkModeContext.Provider value={{ isDarkMode: settings.darkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode(): DarkModeContextValue {
  const context = useContext(DarkModeContext);
  if (!context) {
    throw new Error('useDarkMode must be used within a DarkModeProvider');
  }
  return context;
}

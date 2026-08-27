import { DarkTheme, DefaultTheme, Tabs, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider as StyledThemeProvider } from 'styled-components/native';

import { RepositoryProvider } from '../src/storage/RepositoryContext';
import { DarkModeProvider, useDarkMode } from '../src/theme/DarkModeContext';
import { useAppColors } from '../src/theme/useAppColors';

// useAppColors() reads expo-router's navigation theme via useTheme(), so it
// must run in a component nested inside NavigationThemeProvider, not the one
// that renders it.
function StyledTabs({ isDarkMode }: { isDarkMode: boolean }) {
  const colors = useAppColors();

  return (
    <StyledThemeProvider theme={colors}>
      <Tabs>
        <Tabs.Screen name="index" options={{ title: '메인' }} />
        <Tabs.Screen name="periods" options={{ title: '기간별 지출' }} />
        <Tabs.Screen name="add-expense" options={{ title: '지출내역 추가' }} />
        <Tabs.Screen name="settings" options={{ title: '설정' }} />
      </Tabs>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </StyledThemeProvider>
  );
}

function ThemedTabs() {
  const { isDarkMode } = useDarkMode();

  return (
    <NavigationThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
      <StyledTabs isDarkMode={isDarkMode} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <RepositoryProvider>
      <DarkModeProvider>
        <ThemedTabs />
      </DarkModeProvider>
    </RepositoryProvider>
  );
}

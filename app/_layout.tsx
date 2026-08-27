import { DarkTheme, DefaultTheme, Tabs, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { RepositoryProvider } from '../src/storage/RepositoryContext';
import { DarkModeProvider, useDarkMode } from '../src/theme/DarkModeContext';

function ThemedTabs() {
  const { isDarkMode } = useDarkMode();

  return (
    <ThemeProvider value={isDarkMode ? DarkTheme : DefaultTheme}>
      <Tabs>
        <Tabs.Screen name="index" options={{ title: '메인' }} />
        <Tabs.Screen name="periods" options={{ title: '기간별 지출' }} />
        <Tabs.Screen name="add-expense" options={{ title: '지출내역 추가' }} />
        <Tabs.Screen name="settings" options={{ title: '설정' }} />
      </Tabs>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
    </ThemeProvider>
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

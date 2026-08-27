import { NotoSansKR_400Regular, NotoSansKR_600SemiBold, useFonts } from '@expo-google-fonts/noto-sans-kr';
import { DarkTheme, DefaultTheme, Tabs, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider as StyledThemeProvider } from 'styled-components/native';

import { RepositoryProvider } from '../src/storage/RepositoryContext';
import { DarkModeProvider, useDarkMode } from '../src/theme/DarkModeContext';
import { useAppColors } from '../src/theme/useAppColors';

SplashScreen.preventAutoHideAsync();

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
  const [fontsLoaded, fontError] = useFonts({
    NotoSansKR_400Regular,
    NotoSansKR_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // RepositoryProvider/DarkModeProvider mount unconditionally so their own
  // async readiness work (category seeding, income migration, loading the
  // dark-mode setting) starts immediately in parallel with font loading,
  // rather than waiting for fonts first — only the final visible content is
  // gated on fontsLoaded, so startup latency is max(fonts, repository), not
  // their sum.
  return (
    <RepositoryProvider>
      <DarkModeProvider>{fontsLoaded || fontError ? <ThemedTabs /> : null}</DarkModeProvider>
    </RepositoryProvider>
  );
}

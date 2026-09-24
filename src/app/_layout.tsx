import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { initRevenueCat } from '@/lib/revenuecat';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    initRevenueCat();
  }, []);
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="emergency" />
        <Stack.Screen name="practice" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="profiles" />
        <Stack.Screen name="contraction-timer" />
        <Stack.Screen name="paywall" />
        <Stack.Screen name="explore" />
      </Stack>
    </ThemeProvider>
  );
}


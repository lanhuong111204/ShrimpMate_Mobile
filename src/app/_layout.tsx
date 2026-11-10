import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { FarmProvider } from '@/context/farm-context';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isAuthenticated, isLoading, isFirstLogin } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isFarmSetup = segments[1] === 'farm-setup';
    const isFirstChangePassword = (segments[1] as string) === 'first-change-password';
    const isLoginScreen = (segments[1] as string) === 'login';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && isFirstLogin) {
      // Nếu đang ở màn hình login thì giữ nguyên để hiển thị Modal đổi mật khẩu lần đầu;
      // Nếu mở lại app từ trạng thái khác (cold boot) thì điều hướng về trang đổi mật khẩu lần đầu.
      if (!isFirstChangePassword && !isLoginScreen) {
        router.replace('/(auth)/first-change-password' as any);
      }
    } else if (isAuthenticated && inAuthGroup && !isFarmSetup && !isFirstChangePassword) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, isFirstLogin, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/farm-setup" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/first-change-password" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <FarmProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AnimatedSplashOverlay />
          <RootNavigator />
        </ThemeProvider>
      </FarmProvider>
    </AuthProvider>
  );
}


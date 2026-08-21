import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Stack, useSegments } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme';

function AuthGate({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const session = useAuthStore((s) => s.session);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const firstSegment = segments[0];
  const inAuthGroup = firstSegment === '(auth)';
  const isPublicRoute = firstSegment === 'public' || firstSegment === 'ficha';

  if (!session && !inAuthGroup && !isPublicRoute) {
    return <Redirect href="/(auth)/login" />;
  }

  if (session && inAuthGroup) {
    return <Redirect href="/(tabs)" />;
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    const unsubscribe = init();
    return unsubscribe;
  }, [init]);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="public/[slug]/index" />
            <Stack.Screen name="ficha/[code]/index" />
          </Stack>
        </AuthGate>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

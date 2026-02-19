import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LanguageProvider } from '@/context/LanguageContext';
import { FontSizeProvider } from '@/context/FontSizeContext';
import { Colors } from '@/constants/colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({});

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <FontSizeProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: Colors.background },
              headerTintColor: Colors.accent,
              headerTitleStyle: { fontWeight: '700', color: Colors.text },
              contentStyle: { backgroundColor: Colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="reader/[section]"
              options={{ headerBackTitle: 'Back', title: '' }}
            />
            <Stack.Screen
              name="anaphora/index"
              options={{ title: 'Fere Kidase', headerBackTitle: 'Back' }}
            />
            <Stack.Screen
              name="anaphora/[id]"
              options={{ headerBackTitle: 'Back', title: '' }}
            />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="light" />
        </FontSizeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

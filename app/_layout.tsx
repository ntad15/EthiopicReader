import 'react-native-reanimated';
import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LanguageProvider } from '@/context/LanguageContext';
import { FontSizeProvider } from '@/context/FontSizeContext';
import { View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import HoverableOpacity from '@/components/HoverableOpacity';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Fonts } from '@/constants/fonts';
import CrossIcon from '@/components/CrossIcon';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_800ExtraBold,
} from '@expo-google-fonts/playfair-display';
import {
  EBGaramond_400Regular,
  EBGaramond_400Regular_Italic,
  EBGaramond_500Medium,
  EBGaramond_700Bold,
} from '@expo-google-fonts/eb-garamond';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [loaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_800ExtraBold,
    EBGaramond_400Regular,
    EBGaramond_400Regular_Italic,
    EBGaramond_500Medium,
    EBGaramond_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <FontSizeProvider>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: Colors.background },
                headerTintColor: Colors.burgundy,
                headerTitle: () => (
                  <HoverableOpacity
                    onPress={() => router.navigate('/')}
                    activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 6, padding: 4 }}
                    hoverStyle={{ opacity: 0.7 }}
                  >
                    <View style={{ marginTop: 5 }}>
                      <CrossIcon size={isMobile ? 22 : 14} color={Colors.burgundy} />
                    </View>
                    <Text style={{ fontFamily: Fonts.serifBold, fontSize: isMobile ? 22 : 16, color: Colors.text }}>
                      Qidase Reader
                    </Text>
                  </HoverableOpacity>
                ),
                headerBackVisible: false,
                headerLeft: () => null,
                contentStyle: { backgroundColor: Colors.background },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="reader/[section]" />
              <Stack.Screen name="anaphora/index" />
              <Stack.Screen name="anaphora/[id]" />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar style="dark" />
          </FontSizeProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

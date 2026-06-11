import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { View, ActivityIndicator } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import Theme from '@/constants/theme';

import { useFonts as useSpaceFonts, SpaceGrotesk_400Regular, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { useFonts as useDmFonts, DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';

export default function RootLayout() {
  const colorScheme = 'dark';

  const [spaceLoaded] = useSpaceFonts({ SpaceGrotesk_400Regular, SpaceGrotesk_700Bold });
  const [dmLoaded] = useDmFonts({ DMSans_400Regular, DMSans_500Medium });

  const fontsLoaded = spaceLoaded && dmLoaded;

  const navTheme = {
    dark: true,
    colors: {
      primary: Theme.Colors.dark.primary,
      background: Theme.Colors.dark.background,
      card: Theme.Colors.dark.card,
      text: Theme.Colors.dark.text,
      border: Theme.Colors.dark.border,
      notification: Theme.Colors.dark.accent,
    },
    fonts: {
      regular: { fontFamily: 'Space Grotesk', fontWeight: '400' as const },
      medium: { fontFamily: 'DM Sans', fontWeight: '500' as const },
      light: { fontFamily: 'Space Grotesk', fontWeight: '300' as const },
      thin: { fontFamily: 'DM Sans', fontWeight: '100' as const },
      bold: { fontFamily: 'Space Grotesk', fontWeight: '700' as const },
      heavy: { fontFamily: 'Space Grotesk', fontWeight: '800' as const },
    },
  };

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.Colors[colorScheme].background }}>
        <ActivityIndicator size="large" color={Theme.Colors[colorScheme].primary} />
      </View>
    );
  }

  return (
    <ThemeProvider value={navTheme}>
      <View style={{ flex: 1, backgroundColor: Theme.Colors[colorScheme].background }}>
        <Stack initialRouteName="login">
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
          <Stack.Screen name="dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="ranking" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </View>
    </ThemeProvider>
  );
}

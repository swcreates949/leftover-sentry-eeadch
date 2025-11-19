
import React, { useEffect } from 'react';
import { useColorScheme, Alert } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';
import 'react-native-reanimated';
import { Stack, router } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from '@react-navigation/native';
import { WidgetProvider } from '@/contexts/WidgetContext';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNetworkState } from 'expo-network';
import * as Notifications from 'expo-notifications';
import { useAppStateSync } from '@/hooks/useAppStateSync';

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const networkState = useNetworkState();
  const colorScheme = useColorScheme();

  // Enable automatic iCloud sync when app comes to foreground
  useAppStateSync();

  // Set up notification listeners
  useEffect(() => {
    // Listen for notifications received while app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listen for user interactions with notifications
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      const leftoverId = response.notification.request.content.data?.leftoverId;
      
      // Navigate to leftovers screen when notification is tapped
      if (leftoverId) {
        router.push('/leftovers');
      }
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  const customDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: '#29ABE2',
      background: '#000000',
      card: '#1C1C1E',
      text: '#FFFFFF',
      border: '#38383A',
      notification: '#29ABE2',
    },
  };

  const customLightTheme: Theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: '#29ABE2',
      background: '#F2F2F7',
      card: '#FFFFFF',
      text: '#000000',
      border: '#C6C6C8',
      notification: '#29ABE2',
    },
  };

  return (
    <ThemeProvider
      value={colorScheme === 'dark' ? customDarkTheme : customLightTheme}
    >
      <SystemBars style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{
            presentation: 'modal',
            headerTitle: 'Modal',
          }}
        />
        <Stack.Screen
          name="formsheet"
          options={{
            presentation: 'formSheet',
            headerTitle: 'Form Sheet',
          }}
        />
        <Stack.Screen
          name="transparent-modal"
          options={{
            presentation: 'transparentModal',
            headerShown: false,
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="addLeftover"
          options={{
            presentation: 'modal',
            headerTitle: 'Add Leftover',
          }}
        />
        <Stack.Screen
          name="leftoverDetail"
          options={{
            headerTitle: 'Leftover Details',
          }}
        />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <WidgetProvider>
        <RootLayoutContent />
      </WidgetProvider>
    </GestureHandlerRootView>
  );
}

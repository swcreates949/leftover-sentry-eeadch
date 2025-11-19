
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { leftoverStorage } from '@/utils/leftoverStorage';

export function useAppStateSync() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    // When app comes to foreground, sync from iCloud
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      console.log('App has come to the foreground, syncing from iCloud...');
      try {
        await leftoverStorage.manualSync();
      } catch (error) {
        console.log('Error syncing on app foreground:', error);
      }
    }

    appState.current = nextAppState;
  };
}

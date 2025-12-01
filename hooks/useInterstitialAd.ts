
import { useEffect, useState, useRef } from 'react';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { createInterstitialAd } from '@/utils/adManager';
import { Platform } from 'react-native';

export const useInterstitialAd = () => {
  const [loaded, setLoaded] = useState(false);
  const interstitialRef = useRef<InterstitialAd | null>(null);

  useEffect(() => {
    // Don't load ads on web
    if (Platform.OS === 'web') {
      return;
    }

    const interstitial = createInterstitialAd();
    interstitialRef.current = interstitial;

    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      console.log('Interstitial ad loaded');
      setLoaded(true);
    });

    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('Interstitial ad closed');
      setLoaded(false);
      // Load a new ad for next time
      interstitial.load();
    });

    const unsubscribeError = interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('Interstitial ad error:', error);
      setLoaded(false);
    });

    // Load the ad
    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, []);

  const showAd = async () => {
    if (Platform.OS === 'web') {
      return false;
    }

    if (loaded && interstitialRef.current) {
      try {
        await interstitialRef.current.show();
        return true;
      } catch (error) {
        console.log('Error showing interstitial ad:', error);
        return false;
      }
    }
    return false;
  };

  return { loaded, showAd };
};


import mobileAds, { 
  BannerAd, 
  BannerAdSize, 
  TestIds,
  InterstitialAd,
  AdEventType,
  RewardedAd,
  RewardedAdEventType
} from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

// Initialize Google Mobile Ads
export const initializeAds = async () => {
  try {
    await mobileAds().initialize();
    console.log('Google Mobile Ads initialized');
  } catch (error) {
    console.log('Error initializing ads:', error);
  }
};

// Ad Unit IDs - Replace these with your actual AdMob ad unit IDs
// For now, using test IDs
// 
// TO USE REAL ADS:
// 1. Create an AdMob account at https://admob.google.com
// 2. Create an app in AdMob for both iOS and Android
// 3. Create ad units for each ad type (banner, interstitial, rewarded)
// 4. Replace the TestIds below with your actual ad unit IDs
// 5. Update the app IDs in app.json with your real app IDs
//
// Example real ad unit IDs format:
// ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
// android: 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY',
export const AD_UNIT_IDS = {
  banner: {
    ios: TestIds.BANNER,
    android: TestIds.BANNER,
  },
  interstitial: {
    ios: 'ca-app-pub-9706636677421693~9226138387',
    android: TestIds.INTERSTITIAL,
  },
  rewarded: {
    ios: TestIds.REWARDED,
    android: TestIds.REWARDED,
  },
};

// Get the appropriate ad unit ID based on platform
export const getAdUnitId = (adType: 'banner' | 'interstitial' | 'rewarded'): string => {
  const platform = Platform.OS as 'ios' | 'android';
  return AD_UNIT_IDS[adType][platform] || TestIds.BANNER;
};

// Create and load an interstitial ad
export const createInterstitialAd = () => {
  const interstitial = InterstitialAd.createForAdRequest(getAdUnitId('interstitial'), {
    requestNonPersonalizedAdsOnly: false,
  });

  return interstitial;
};

// Create and load a rewarded ad
export const createRewardedAd = () => {
  const rewarded = RewardedAd.createForAdRequest(getAdUnitId('rewarded'), {
    requestNonPersonalizedAdsOnly: false,
  });

  return rewarded;
};

// Helper to show interstitial ad with error handling
export const showInterstitialAd = async (interstitial: InterstitialAd) => {
  try {
    if (interstitial.loaded) {
      await interstitial.show();
      return true;
    } else {
      console.log('Interstitial ad not loaded yet');
      return false;
    }
  } catch (error) {
    console.log('Error showing interstitial ad:', error);
    return false;
  }
};

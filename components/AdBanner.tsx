
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { getAdUnitId } from '@/utils/adManager';

interface AdBannerProps {
  size?: BannerAdSize;
}

export default function AdBanner({ size = BannerAdSize.BANNER }: AdBannerProps) {
  // Don't show ads on web
  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={getAdUnitId('banner')}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={() => {
          console.log('Banner ad loaded');
        }}
        onAdFailedToLoad={(error) => {
          console.log('Banner ad failed to load:', error);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginVertical: 10,
  },
});

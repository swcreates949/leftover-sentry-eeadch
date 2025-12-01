
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { Leftover } from '@/types/leftover';
import { leftoverStorage, calculateDaysRemaining, getExpiryStatus } from '@/utils/leftoverStorage';
import * as Haptics from 'expo-haptics';
import AdBanner from '@/components/AdBanner';
import { BannerAdSize } from 'react-native-google-mobile-ads';
import { useInterstitialAd } from '@/hooks/useInterstitialAd';

export default function LeftoversScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [leftovers, setLeftovers] = useState<Leftover[]>([]);
  const [loading, setLoading] = useState(true);
  const [addCount, setAddCount] = useState(0);
  const { loaded: interstitialLoaded, showAd: showInterstitialAd } = useInterstitialAd();

  // Responsive sizing
  const padding = width * 0.04;
  const headerPadding = width * 0.05;
  const fontSize = Math.min(width * 0.04, 16);
  const titleSize = Math.min(width * 0.045, 17);
  const iconSize = Math.min(width * 0.07, 28);

  const loadLeftovers = async () => {
    try {
      const data = await leftoverStorage.getAll();
      const sorted = data.sort((a, b) => {
        const daysA = calculateDaysRemaining(a.dateAdded, a.daysUntilExpiry);
        const daysB = calculateDaysRemaining(b.dateAdded, b.daysUntilExpiry);
        return daysA - daysB;
      });
      setLeftovers(sorted);
    } catch (error) {
      console.log('Error loading leftovers:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadLeftovers();
    }, [])
  );

  const handleAddLeftover = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Show interstitial ad every 3 additions
    const newCount = addCount + 1;
    setAddCount(newCount);
    
    if (newCount % 3 === 0 && Platform.OS !== 'web') {
      await showInterstitialAd();
    }
    
    router.push('/addLeftover');
  };

  const handleRecipeSuggestions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/recipes');
  };

  const handleLeftoverPress = (leftover: Leftover) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/leftoverDetail',
      params: { id: leftover.id },
    });
  };

  const handleDeleteLeftover = async (id: string, name: string) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Delete "${name}"?`);
      if (confirmed) {
        await leftoverStorage.delete(id);
        await loadLeftovers();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      Alert.alert(
        'Delete Leftover',
        `Are you sure you want to delete "${name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await leftoverStorage.delete(id);
              await loadLeftovers();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            },
          },
        ]
      );
    }
  };

  const renderLeftoverCard = (leftover: Leftover, index: number) => {
    const daysRemaining = calculateDaysRemaining(leftover.dateAdded, leftover.daysUntilExpiry);
    const status = getExpiryStatus(daysRemaining);

    let statusColor = colors.success;
    let statusText = `${daysRemaining} days left`;
    let statusIcon = 'check-circle';

    if (status === 'expired') {
      statusColor = colors.danger;
      statusText = 'Expired';
      statusIcon = 'cancel';
    } else if (status === 'warning') {
      statusColor = colors.warning;
      statusText = daysRemaining === 0 ? 'Expires today!' : '1 day left';
      statusIcon = 'warning';
    }

    return (
      <React.Fragment key={index}>
        <TouchableOpacity
          style={[styles.leftoverCard, { borderLeftColor: statusColor, borderLeftWidth: 4, padding }]}
          onPress={() => handleLeftoverPress(leftover)}
          activeOpacity={0.7}
        >
          <View style={styles.cardContent}>
            <View style={styles.leftoverInfo}>
              <View style={[styles.iconContainer, { width: width * 0.12, height: width * 0.12, borderRadius: width * 0.06 }]}>
                <IconSymbol
                  ios_icon_name="fork.knife"
                  android_material_icon_name="restaurant"
                  size={iconSize}
                  color={colors.primary}
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.leftoverName, { fontSize: titleSize }]} numberOfLines={1}>
                  {leftover.name}
                </Text>
                <Text style={[styles.leftoverDate, { fontSize: Math.min(width * 0.035, 13) }]}>
                  Added: {new Date(leftover.dateAdded).toLocaleDateString()}
                </Text>
                {leftover.category && (
                  <Text style={[styles.leftoverCategory, { fontSize: Math.min(width * 0.032, 12) }]}>
                    {leftover.category}
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.statusContainer}>
              <IconSymbol
                ios_icon_name={statusIcon === 'check-circle' ? 'checkmark.circle.fill' : statusIcon === 'warning' ? 'exclamationmark.triangle.fill' : 'xmark.circle.fill'}
                android_material_icon_name={statusIcon}
                size={Math.min(width * 0.055, 22)}
                color={statusColor}
              />
              <Text style={[styles.statusText, { color: statusColor, fontSize: Math.min(width * 0.03, 11) }]}>
                {statusText}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteLeftover(leftover.id, leftover.name)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol
              ios_icon_name="trash.fill"
              android_material_icon_name="delete"
              size={Math.min(width * 0.045, 18)}
              color={colors.danger}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </React.Fragment>
    );
  };

  return (
    <View style={commonStyles.container}>
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? 48 : 16, paddingHorizontal: headerPadding, paddingBottom: height * 0.02 }]}>
        <Text style={[styles.headerTitle, { fontSize: Math.min(width * 0.07, 28) }]}>My Leftovers</Text>
        <Text style={[styles.headerSubtitle, { fontSize }]}>Track what&apos;s in your fridge</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { padding, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {leftovers.length > 0 && (
          <TouchableOpacity
            style={[styles.recipeSuggestionBanner, { padding }]}
            onPress={handleRecipeSuggestions}
            activeOpacity={0.8}
          >
            <View style={[styles.bannerIcon, { width: width * 0.11, height: width * 0.11, borderRadius: width * 0.055 }]}>
              <IconSymbol
                ios_icon_name="lightbulb.fill"
                android_material_icon_name="lightbulb"
                size={Math.min(width * 0.065, 26)}
                color="#ffffff"
              />
            </View>
            <View style={styles.bannerText}>
              <Text style={[styles.bannerTitle, { fontSize }]}>Get Recipe Ideas!</Text>
              <Text style={[styles.bannerSubtitle, { fontSize: Math.min(width * 0.033, 12) }]}>
                See what you can make with your leftovers
              </Text>
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={Math.min(width * 0.055, 22)}
              color="#ffffff"
            />
          </TouchableOpacity>
        )}

        {/* Ad Banner after 3 items */}
        {leftovers.length >= 3 && (
          <AdBanner size={BannerAdSize.BANNER} />
        )}

        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { fontSize }]}>Loading...</Text>
          </View>
        ) : leftovers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="refrigerator"
              android_material_icon_name="kitchen"
              size={Math.min(width * 0.18, 70)}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { fontSize: Math.min(width * 0.055, 22), marginTop: height * 0.02 }]}>
              No leftovers yet
            </Text>
            <Text style={[styles.emptyText, { fontSize }]}>
              Tap the + button below to add your first leftover
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {leftovers.map((leftover, index) => renderLeftoverCard(leftover, index))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity 
        style={[styles.fab, { width: width * 0.14, height: width * 0.14, borderRadius: width * 0.07, bottom: 100, right: padding }]} 
        onPress={handleAddLeftover} 
        activeOpacity={0.8}
      >
        <IconSymbol
          ios_icon_name="plus"
          android_material_icon_name="add"
          size={Math.min(width * 0.065, 26)}
          color="#ffffff"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.card,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  headerTitle: {
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontWeight: '400',
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
  },
  recipeSuggestionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginBottom: 12,
    boxShadow: '0px 4px 12px rgba(41, 171, 226, 0.3)',
    elevation: 4,
  },
  bannerIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  listContainer: {
    gap: 10,
  },
  leftoverCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
    position: 'relative',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftoverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 40,
  },
  iconContainer: {
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  leftoverName: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  leftoverDate: {
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  leftoverCategory: {
    fontWeight: '500',
    color: colors.primary,
  },
  statusContainer: {
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(41, 171, 226, 0.4)',
    elevation: 6,
  },
});

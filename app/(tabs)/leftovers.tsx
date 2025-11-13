
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { Leftover } from '@/types/leftover';
import { leftoverStorage, calculateDaysRemaining, getExpiryStatus } from '@/utils/leftoverStorage';
import * as Haptics from 'expo-haptics';

export default function LeftoversScreen() {
  const router = useRouter();
  const [leftovers, setLeftovers] = useState<Leftover[]>([]);
  const [loading, setLoading] = useState(true);

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

  const handleAddLeftover = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/addLeftover');
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
          style={[styles.leftoverCard, { borderLeftColor: statusColor, borderLeftWidth: 4 }]}
          onPress={() => handleLeftoverPress(leftover)}
          activeOpacity={0.7}
        >
          <View style={styles.cardContent}>
            <View style={styles.leftoverInfo}>
              <View style={styles.iconContainer}>
                <IconSymbol
                  ios_icon_name="fork.knife"
                  android_material_icon_name="restaurant"
                  size={32}
                  color={colors.primary}
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.leftoverName} numberOfLines={1}>
                  {leftover.name}
                </Text>
                <Text style={styles.leftoverDate}>
                  Added: {new Date(leftover.dateAdded).toLocaleDateString()}
                </Text>
                {leftover.category && (
                  <Text style={styles.leftoverCategory}>{leftover.category}</Text>
                )}
              </View>
            </View>
            <View style={styles.statusContainer}>
              <IconSymbol
                ios_icon_name={statusIcon === 'check-circle' ? 'checkmark.circle.fill' : statusIcon === 'warning' ? 'exclamationmark.triangle.fill' : 'xmark.circle.fill'}
                android_material_icon_name={statusIcon}
                size={24}
                color={statusColor}
              />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
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
              size={20}
              color={colors.danger}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </React.Fragment>
    );
  };

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Leftovers</Text>
        <Text style={styles.headerSubtitle}>Track what&apos;s in your fridge</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        ) : leftovers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol
              ios_icon_name="refrigerator"
              android_material_icon_name="kitchen"
              size={80}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>No leftovers yet</Text>
            <Text style={styles.emptyText}>
              Tap the + button below to add your first leftover
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {leftovers.map((leftover, index) => renderLeftoverCard(leftover, index))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleAddLeftover} activeOpacity={0.8}>
        <IconSymbol
          ios_icon_name="plus"
          android_material_icon_name="add"
          size={28}
          color="#ffffff"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === 'android' ? 48 : 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },
  listContainer: {
    gap: 12,
  },
  leftoverCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  leftoverName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  leftoverDate: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  leftoverCategory: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  statusContainer: {
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(41, 171, 226, 0.4)',
    elevation: 6,
  },
});

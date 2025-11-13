
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors, commonStyles } from '@/styles/commonStyles';
import { Leftover } from '@/types/leftover';
import { leftoverStorage, calculateDaysRemaining, getExpiryStatus } from '@/utils/leftoverStorage';
import * as Haptics from 'expo-haptics';

export default function LeftoverDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [leftover, setLeftover] = useState<Leftover | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeftover();
  }, [params.id]);

  const loadLeftover = async () => {
    try {
      const leftovers = await leftoverStorage.getAll();
      const found = leftovers.find(l => l.id === params.id);
      setLeftover(found || null);
    } catch (error) {
      console.log('Error loading leftover:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!leftover) return;

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Delete "${leftover.name}"?`);
      if (confirmed) {
        await leftoverStorage.delete(leftover.id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }
    } else {
      Alert.alert(
        'Delete Leftover',
        `Are you sure you want to delete "${leftover.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await leftoverStorage.delete(leftover.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            },
          },
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={commonStyles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>
    );
  }

  if (!leftover) {
    return (
      <View style={commonStyles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow-back"
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Not Found</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Leftover not found</Text>
        </View>
      </View>
    );
  }

  const daysRemaining = calculateDaysRemaining(leftover.dateAdded, leftover.daysUntilExpiry);
  const status = getExpiryStatus(daysRemaining);
  const daysPassed = leftover.daysUntilExpiry - daysRemaining;

  let statusColor = colors.success;
  let statusText = 'Fresh';
  let statusIcon = 'check-circle';
  let statusMessage = `This leftover is still fresh and safe to eat.`;

  if (status === 'expired') {
    statusColor = colors.danger;
    statusText = 'Expired';
    statusIcon = 'cancel';
    statusMessage = `This leftover has expired and should be thrown away.`;
  } else if (status === 'warning') {
    statusColor = colors.warning;
    statusText = 'Eat Soon';
    statusIcon = 'warning';
    statusMessage = `This leftover should be eaten soon or thrown away.`;
  }

  return (
    <View style={commonStyles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {leftover.name}
        </Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol
            ios_icon_name="trash.fill"
            android_material_icon_name="delete"
            size={24}
            color={colors.danger}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.statusCard, { backgroundColor: statusColor }]}>
          <IconSymbol
            ios_icon_name={statusIcon === 'check-circle' ? 'checkmark.circle.fill' : statusIcon === 'warning' ? 'exclamationmark.triangle.fill' : 'xmark.circle.fill'}
            android_material_icon_name={statusIcon}
            size={64}
            color="#ffffff"
          />
          <Text style={styles.statusTitle}>{statusText}</Text>
          <Text style={styles.statusSubtitle}>{statusMessage}</Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <IconSymbol
                ios_icon_name="calendar"
                android_material_icon_name="calendar-today"
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Date Added</Text>
              <Text style={styles.infoValue}>
                {new Date(leftover.dateAdded).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <IconSymbol
                ios_icon_name="clock.fill"
                android_material_icon_name="schedule"
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Days in Fridge</Text>
              <Text style={styles.infoValue}>{daysPassed} days</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoIconContainer}>
              <IconSymbol
                ios_icon_name="hourglass"
                android_material_icon_name="hourglass-empty"
                size={24}
                color={colors.primary}
              />
            </View>
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Days Remaining</Text>
              <Text style={[styles.infoValue, { color: statusColor }]}>
                {daysRemaining >= 0 ? `${daysRemaining} days` : 'Expired'}
              </Text>
            </View>
          </View>

          {leftover.category && (
            <React.Fragment key="category">
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <IconSymbol
                    ios_icon_name="tag.fill"
                    android_material_icon_name="label"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Category</Text>
                  <Text style={styles.infoValue}>{leftover.category}</Text>
                </View>
              </View>
            </React.Fragment>
          )}

          {leftover.notes && (
            <React.Fragment key="notes">
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={styles.infoIconContainer}>
                  <IconSymbol
                    ios_icon_name="note.text"
                    android_material_icon_name="note"
                    size={24}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Notes</Text>
                  <Text style={styles.infoValue}>{leftover.notes}</Text>
                </View>
              </View>
            </React.Fragment>
          )}
        </View>

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Storage Tips</Text>
          <View style={styles.tipRow}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Store leftovers in airtight containers to maintain freshness
            </Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Keep your refrigerator at 40°F (4°C) or below
            </Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              Label containers with dates to track freshness
            </Text>
          </View>
          <View style={styles.tipRow}>
            <Text style={styles.tipBullet}>•</Text>
            <Text style={styles.tipText}>
              When in doubt, throw it out - trust your senses
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 48 : 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: colors.card,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  backButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.9,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.highlight,
    marginVertical: 8,
  },
  tipsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  tipsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  tipRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tipBullet: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 22,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});

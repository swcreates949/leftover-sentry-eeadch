
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
import { leftoverStorage, calculateDaysRemaining, getExpiryStatus, calculateExpiryDate } from '@/utils/leftoverStorage';
import * as Haptics from 'expo-haptics';

export default function LeftoverDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [leftover, setLeftover] = useState<Leftover | null>(null);

  useEffect(() => {
    loadLeftover();
  }, [params.id]);

  const loadLeftover = async () => {
    try {
      const leftovers = await leftoverStorage.getAll();
      const found = leftovers.find(l => l.id === params.id);
      if (found) {
        setLeftover(found);
      } else {
        Alert.alert('Error', 'Leftover not found');
        router.back();
      }
    } catch (error) {
      console.log('Error loading leftover:', error);
      Alert.alert('Error', 'Failed to load leftover');
      router.back();
    }
  };

  const handleDelete = async () => {
    if (!leftover) return;

    const confirmDelete = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      leftoverStorage.delete(leftover.id);
      router.back();
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${leftover.name}"?`)) {
        confirmDelete();
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
            onPress: confirmDelete,
          },
        ]
      );
    }
  };

  if (!leftover) {
    return (
      <View style={commonStyles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const daysRemaining = calculateDaysRemaining(leftover.dateAdded, leftover.daysUntilExpiry);
  const status = getExpiryStatus(daysRemaining);
  const expiryDate = calculateExpiryDate(leftover.dateAdded, leftover.daysUntilExpiry);

  let statusColor = colors.success;
  let statusText = `${daysRemaining} days left`;
  let statusIcon = 'checkmark.circle.fill';

  if (status === 'expired') {
    statusColor = colors.danger;
    statusText = 'Expired';
    statusIcon = 'xmark.circle.fill';
  } else if (status === 'warning') {
    statusColor = colors.warning;
    statusText = daysRemaining === 0 ? 'Expires today!' : '1 day left';
    statusIcon = 'exclamationmark.triangle.fill';
  }

  return (
    <View style={commonStyles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.statusCard, { backgroundColor: statusColor + '20' }]}>
          <IconSymbol
            ios_icon_name={statusIcon}
            android_material_icon_name={
              status === 'expired' ? 'cancel' : status === 'warning' ? 'warning' : 'check_circle'
            }
            size={48}
            color={statusColor}
          />
          <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.iconHeader}>
            <View style={styles.iconCircle}>
              <IconSymbol
                ios_icon_name="fork.knife"
                android_material_icon_name="restaurant"
                size={40}
                color={colors.primary}
              />
            </View>
          </View>
          <Text style={styles.name}>{leftover.name}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar_today"
              size={24}
              color={colors.primary}
            />
            <View style={styles.infoContent}>
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
            <IconSymbol
              ios_icon_name="clock.fill"
              android_material_icon_name="schedule"
              size={24}
              color={colors.primary}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Expiry Date</Text>
              <Text style={styles.infoValue}>
                {expiryDate.toLocaleDateString('en-US', {
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
            <IconSymbol
              ios_icon_name="hourglass"
              android_material_icon_name="hourglass_empty"
              size={24}
              color={colors.primary}
            />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Storage Duration</Text>
              <Text style={styles.infoValue}>{leftover.daysUntilExpiry} days</Text>
            </View>
          </View>

          {leftover.category && (
            <React.Fragment>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="tag.fill"
                  android_material_icon_name="label"
                  size={24}
                  color={colors.primary}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Category</Text>
                  <Text style={styles.infoValue}>{leftover.category}</Text>
                </View>
              </View>
            </React.Fragment>
          )}

          {leftover.notificationId && (
            <React.Fragment>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="bell.badge.fill"
                  android_material_icon_name="notifications_active"
                  size={24}
                  color={colors.success}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Notification</Text>
                  <Text style={styles.infoValue}>Scheduled for expiry</Text>
                </View>
              </View>
            </React.Fragment>
          )}
        </View>

        {leftover.notes && (
          <View style={styles.card}>
            <View style={styles.notesHeader}>
              <IconSymbol
                ios_icon_name="note.text"
                android_material_icon_name="note"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.notesTitle}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{leftover.notes}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <IconSymbol
            ios_icon_name="trash.fill"
            android_material_icon_name="delete"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.deleteButtonText}>Delete Leftover</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statusCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  iconHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  infoContent: {
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
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  notesText: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
    lineHeight: 24,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    borderRadius: 12,
    padding: 18,
    gap: 8,
    marginTop: 8,
    boxShadow: '0px 4px 12px rgba(255, 59, 48, 0.3)',
    elevation: 4,
  },
  deleteButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

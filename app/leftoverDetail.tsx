
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Image,
  useWindowDimensions,
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
  const { width, height } = useWindowDimensions();
  const [leftover, setLeftover] = useState<Leftover | null>(null);

  // Responsive sizing
  const padding = width * 0.05;
  const fontSize = Math.min(width * 0.04, 16);
  const titleSize = Math.min(width * 0.045, 17);
  const iconSize = Math.min(width * 0.07, 28);
  const largeIconSize = Math.min(width * 0.1, 40);

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
          <Text style={[styles.loadingText, { fontSize }]}>Loading...</Text>
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
        contentContainerStyle={[styles.scrollContent, { padding, paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.statusCard, { backgroundColor: statusColor + '20', padding: height * 0.025 }]}>
          <IconSymbol
            ios_icon_name={statusIcon}
            android_material_icon_name={
              status === 'expired' ? 'cancel' : status === 'warning' ? 'warning' : 'check_circle'
            }
            size={Math.min(width * 0.11, 44)}
            color={statusColor}
          />
          <Text style={[styles.statusText, { color: statusColor, fontSize: Math.min(width * 0.055, 22), marginTop: height * 0.015 }]}>
            {statusText}
          </Text>
        </View>

        {leftover.imageUri && (
          <View style={[styles.imageCard, { marginBottom: height * 0.025 }]}>
            <Image source={{ uri: leftover.imageUri }} style={[styles.leftoverImage, { height: height * 0.3 }]} />
          </View>
        )}

        <View style={[styles.card, { padding, marginBottom: height * 0.02 }]}>
          <View style={[styles.iconHeader, { marginBottom: height * 0.02 }]}>
            <View style={[styles.iconCircle, { width: width * 0.18, height: width * 0.18, borderRadius: width * 0.09 }]}>
              <IconSymbol
                ios_icon_name="fork.knife"
                android_material_icon_name="restaurant"
                size={largeIconSize}
                color={colors.primary}
              />
            </View>
          </View>
          <Text style={[styles.name, { fontSize: Math.min(width * 0.065, 26) }]}>{leftover.name}</Text>
        </View>

        <View style={[styles.card, { padding, marginBottom: height * 0.02 }]}>
          <View style={styles.infoRow}>
            <IconSymbol
              ios_icon_name="calendar"
              android_material_icon_name="calendar_today"
              size={iconSize}
              color={colors.primary}
            />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { fontSize: Math.min(width * 0.035, 13), marginBottom: height * 0.005 }]}>
                Date Added
              </Text>
              <Text style={[styles.infoValue, { fontSize }]}>
                {new Date(leftover.dateAdded).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { marginVertical: height * 0.02 }]} />

          <View style={styles.infoRow}>
            <IconSymbol
              ios_icon_name="clock.fill"
              android_material_icon_name="schedule"
              size={iconSize}
              color={colors.primary}
            />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { fontSize: Math.min(width * 0.035, 13), marginBottom: height * 0.005 }]}>
                Expiry Date
              </Text>
              <Text style={[styles.infoValue, { fontSize }]}>
                {expiryDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { marginVertical: height * 0.02 }]} />

          <View style={styles.infoRow}>
            <IconSymbol
              ios_icon_name="hourglass"
              android_material_icon_name="hourglass_empty"
              size={iconSize}
              color={colors.primary}
            />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { fontSize: Math.min(width * 0.035, 13), marginBottom: height * 0.005 }]}>
                Storage Duration
              </Text>
              <Text style={[styles.infoValue, { fontSize }]}>{leftover.daysUntilExpiry} days</Text>
            </View>
          </View>

          {leftover.category && (
            <React.Fragment>
              <View style={[styles.divider, { marginVertical: height * 0.02 }]} />
              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="tag.fill"
                  android_material_icon_name="label"
                  size={iconSize}
                  color={colors.primary}
                />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { fontSize: Math.min(width * 0.035, 13), marginBottom: height * 0.005 }]}>
                    Category
                  </Text>
                  <Text style={[styles.infoValue, { fontSize }]}>{leftover.category}</Text>
                </View>
              </View>
            </React.Fragment>
          )}

          {leftover.notificationId && (
            <React.Fragment>
              <View style={[styles.divider, { marginVertical: height * 0.02 }]} />
              <View style={styles.infoRow}>
                <IconSymbol
                  ios_icon_name="bell.badge.fill"
                  android_material_icon_name="notifications_active"
                  size={iconSize}
                  color={colors.success}
                />
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { fontSize: Math.min(width * 0.035, 13), marginBottom: height * 0.005 }]}>
                    Notification
                  </Text>
                  <Text style={[styles.infoValue, { fontSize }]}>Scheduled for expiry</Text>
                </View>
              </View>
            </React.Fragment>
          )}
        </View>

        {leftover.notes && (
          <View style={[styles.card, { padding, marginBottom: height * 0.02 }]}>
            <View style={[styles.notesHeader, { marginBottom: height * 0.015 }]}>
              <IconSymbol
                ios_icon_name="note.text"
                android_material_icon_name="note"
                size={iconSize}
                color={colors.primary}
              />
              <Text style={[styles.notesTitle, { fontSize: titleSize }]}>Notes</Text>
            </View>
            <Text style={[styles.notesText, { fontSize }]}>{leftover.notes}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.deleteButton, { padding: height * 0.02 }]}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <IconSymbol
            ios_icon_name="trash.fill"
            android_material_icon_name="delete"
            size={Math.min(width * 0.045, 18)}
            color="#FFFFFF"
          />
          <Text style={[styles.deleteButtonText, { fontSize: titleSize }]}>Delete Leftover</Text>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
  },
  statusCard: {
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontWeight: '700',
  },
  imageCard: {
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  leftoverImage: {
    width: '100%',
    backgroundColor: colors.card,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  iconHeader: {
    alignItems: 'center',
  },
  iconCircle: {
    backgroundColor: colors.highlight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontWeight: '500',
    color: colors.textSecondary,
  },
  infoValue: {
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notesTitle: {
    fontWeight: '700',
    color: colors.text,
  },
  notesText: {
    fontWeight: '400',
    color: colors.text,
    lineHeight: 22,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    borderRadius: 10,
    gap: 8,
    marginTop: 8,
    boxShadow: '0px 4px 12px rgba(255, 59, 48, 0.3)',
    elevation: 4,
  },
  deleteButtonText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

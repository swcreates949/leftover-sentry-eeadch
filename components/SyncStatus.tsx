
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { iCloudStorage } from '@/utils/iCloudStorage';
import { leftoverStorage } from '@/utils/leftoverStorage';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from './IconSymbol';

export function SyncStatus() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    checkAvailability();
    loadLastSyncTime();
  }, []);

  const checkAvailability = async () => {
    if (Platform.OS === 'ios') {
      const available = await iCloudStorage.isICloudAvailable();
      setIsAvailable(available);
    }
  };

  const loadLastSyncTime = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const lastSync = localStorage.getItem('@last_sync_time');
      if (lastSync) {
        const date = new Date(parseInt(lastSync, 10));
        setLastSyncTime(date.toLocaleString());
      }
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const success = await leftoverStorage.manualSync();
      if (success) {
        loadLastSyncTime();
      }
    } catch (error) {
      console.log('Error during manual sync:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (Platform.OS !== 'ios') {
    return (
      <View style={styles.container}>
        <View style={styles.infoContainer}>
          <IconSymbol 
            ios_icon_name="info.circle" 
            android_material_icon_name="info" 
            size={24} 
            color={colors.text} 
          />
          <Text style={styles.infoText}>
            iCloud sync is only available on iOS devices
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconSymbol 
          ios_icon_name="icloud" 
          android_material_icon_name="cloud" 
          size={28} 
          color={isAvailable ? colors.primary : colors.textSecondary} 
        />
        <Text style={styles.title}>iCloud Sync</Text>
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Text style={styles.label}>Status:</Text>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: isAvailable ? '#4CAF50' : '#FF9800' }]} />
            <Text style={styles.statusText}>
              {isAvailable ? 'Connected' : 'Not Available'}
            </Text>
          </View>
        </View>

        {lastSyncTime && (
          <View style={styles.statusRow}>
            <Text style={styles.label}>Last Sync:</Text>
            <Text style={styles.value}>{lastSyncTime}</Text>
          </View>
        )}
      </View>

      {isAvailable && (
        <TouchableOpacity 
          style={[styles.syncButton, isSyncing && styles.syncButtonDisabled]}
          onPress={handleManualSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <IconSymbol 
                ios_icon_name="arrow.clockwise" 
                android_material_icon_name="sync" 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.syncButtonText}>Sync Now</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoDescription}>
          • Your leftover data automatically syncs to iCloud{'\n'}
          • Access your data on all iOS devices signed in with the same Apple ID{'\n'}
          • Changes sync automatically when you add, edit, or delete items{'\n'}
          • Manual sync available if needed
        </Text>
      </View>

      {!isAvailable && (
        <View style={styles.warningBox}>
          <IconSymbol 
            ios_icon_name="exclamationmark.triangle" 
            android_material_icon_name="warning" 
            size={20} 
            color="#FF9800" 
          />
          <Text style={styles.warningText}>
            Make sure you&apos;re signed in to iCloud in your device settings
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginVertical: 10,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 12,
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  syncButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  syncButtonDisabled: {
    opacity: 0.6,
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoBox: {
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#FF9800',
    marginLeft: 8,
    lineHeight: 18,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
    lineHeight: 20,
  },
});


import { Leftover } from '@/types/leftover';
import { notificationManager } from './notificationManager';
import { iCloudStorage } from './iCloudStorage';
import { Platform } from 'react-native';

const STORAGE_KEY = '@leftovers_storage';
const LAST_SYNC_KEY = '@last_sync_time';

interface StorageData {
  leftovers: Leftover[];
  lastModified: number;
}

export const leftoverStorage = {
  // Track if we're currently syncing to prevent race conditions
  isSyncing: false,

  async getAll(): Promise<Leftover[]> {
    try {
      // Try to sync from iCloud first on iOS
      if (Platform.OS === 'ios') {
        await this.syncFromICloud();
      }

      // Read from local storage
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
      }
      return [];
    } catch (error) {
      console.log('Error loading leftovers:', error);
      return [];
    }
  },

  async save(leftovers: Leftover[]): Promise<void> {
    try {
      const storageData: StorageData = {
        leftovers,
        lastModified: Date.now(),
      };

      // Save to local storage
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(leftovers));
        localStorage.setItem(LAST_SYNC_KEY, storageData.lastModified.toString());
      }

      // Save to iCloud on iOS
      if (Platform.OS === 'ios') {
        await this.syncToICloud(storageData);
      }
    } catch (error) {
      console.log('Error saving leftovers:', error);
    }
  },

  async syncFromICloud(): Promise<void> {
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    try {
      this.isSyncing = true;
      const isAvailable = await iCloudStorage.isICloudAvailable();
      
      if (!isAvailable) {
        console.log('iCloud not available, using local storage only');
        return;
      }

      // Get iCloud data
      const iCloudData = await iCloudStorage.readData<StorageData>();
      
      if (!iCloudData) {
        console.log('No iCloud data found, will upload local data');
        // Upload local data to iCloud if it exists
        const localData = localStorage.getItem(STORAGE_KEY);
        if (localData) {
          const leftovers = JSON.parse(localData);
          const storageData: StorageData = {
            leftovers,
            lastModified: Date.now(),
          };
          await iCloudStorage.writeData(storageData);
        }
        return;
      }

      // Get local last modified time
      const localLastModified = localStorage.getItem(LAST_SYNC_KEY);
      const localTime = localLastModified ? parseInt(localLastModified, 10) : 0;

      // Compare timestamps and use the most recent data
      if (iCloudData.lastModified > localTime) {
        console.log('iCloud data is newer, updating local storage');
        localStorage.setItem(STORAGE_KEY, JSON.stringify(iCloudData.leftovers));
        localStorage.setItem(LAST_SYNC_KEY, iCloudData.lastModified.toString());
        
        // Reschedule notifications for all leftovers
        await this.rescheduleAllNotifications(iCloudData.leftovers);
      } else if (localTime > iCloudData.lastModified) {
        console.log('Local data is newer, updating iCloud');
        const localData = localStorage.getItem(STORAGE_KEY);
        if (localData) {
          const leftovers = JSON.parse(localData);
          const storageData: StorageData = {
            leftovers,
            lastModified: localTime,
          };
          await iCloudStorage.writeData(storageData);
        }
      } else {
        console.log('Data is in sync');
      }
    } catch (error) {
      console.log('Error syncing from iCloud:', error);
    } finally {
      this.isSyncing = false;
    }
  },

  async syncToICloud(storageData: StorageData): Promise<void> {
    try {
      const isAvailable = await iCloudStorage.isICloudAvailable();
      
      if (!isAvailable) {
        console.log('iCloud not available for sync');
        return;
      }

      await iCloudStorage.writeData(storageData);
      console.log('Successfully synced to iCloud');
    } catch (error) {
      console.log('Error syncing to iCloud:', error);
    }
  },

  async rescheduleAllNotifications(leftovers: Leftover[]): Promise<void> {
    // Cancel all existing notifications
    await notificationManager.cancelAllNotifications();

    // Reschedule notifications for all leftovers
    for (const leftover of leftovers) {
      const expiryDate = calculateExpiryDate(leftover.dateAdded, leftover.daysUntilExpiry);
      const now = new Date();
      
      // Only schedule if not expired
      if (expiryDate > now) {
        await notificationManager.scheduleExpiryNotification(
          leftover.id,
          leftover.name,
          expiryDate
        );
      }
    }
  },

  async add(leftover: Leftover): Promise<void> {
    const leftovers = await this.getAll();
    
    // Calculate expiry date and schedule notification
    const expiryDate = calculateExpiryDate(leftover.dateAdded, leftover.daysUntilExpiry);
    const notificationId = await notificationManager.scheduleExpiryNotification(
      leftover.id,
      leftover.name,
      expiryDate
    );
    
    // Add notification ID to leftover
    const leftoverWithNotification = {
      ...leftover,
      notificationId: notificationId || undefined,
    };
    
    leftovers.push(leftoverWithNotification);
    await this.save(leftovers);
  },

  async update(id: string, updates: Partial<Leftover>): Promise<void> {
    const leftovers = await this.getAll();
    const index = leftovers.findIndex(l => l.id === id);
    if (index !== -1) {
      const oldLeftover = leftovers[index];
      
      // Cancel old notification if it exists
      if (oldLeftover.notificationId) {
        await notificationManager.cancelNotification(oldLeftover.notificationId);
      }
      
      // Update leftover
      leftovers[index] = { ...oldLeftover, ...updates };
      
      // If date or expiry days changed, reschedule notification
      if (updates.dateAdded || updates.daysUntilExpiry) {
        const updatedLeftover = leftovers[index];
        const expiryDate = calculateExpiryDate(
          updatedLeftover.dateAdded,
          updatedLeftover.daysUntilExpiry
        );
        const notificationId = await notificationManager.scheduleExpiryNotification(
          updatedLeftover.id,
          updatedLeftover.name,
          expiryDate
        );
        leftovers[index].notificationId = notificationId || undefined;
      }
      
      await this.save(leftovers);
    }
  },

  async delete(id: string): Promise<void> {
    const leftovers = await this.getAll();
    const leftover = leftovers.find(l => l.id === id);
    
    // Cancel notification if it exists
    if (leftover?.notificationId) {
      await notificationManager.cancelNotification(leftover.notificationId);
    }
    
    const filtered = leftovers.filter(l => l.id !== id);
    await this.save(filtered);
  },

  // Manual sync function that can be called by the user
  async manualSync(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }

    try {
      await this.syncFromICloud();
      return true;
    } catch (error) {
      console.log('Error during manual sync:', error);
      return false;
    }
  },
};

export function calculateExpiryDate(dateAdded: string, daysUntilExpiry: number): Date {
  const addedDate = new Date(dateAdded);
  const expiryDate = new Date(addedDate);
  expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);
  return expiryDate;
}

export function calculateDaysRemaining(dateAdded: string, daysUntilExpiry: number): number {
  const addedDate = new Date(dateAdded);
  const today = new Date();
  const daysPassed = Math.floor((today.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysUntilExpiry - daysPassed;
}

export function getExpiryStatus(daysRemaining: number): 'fresh' | 'warning' | 'expired' {
  if (daysRemaining < 0) return 'expired';
  if (daysRemaining <= 1) return 'warning';
  return 'fresh';
}


import { Leftover } from '@/types/leftover';
import { notificationManager } from './notificationManager';

const STORAGE_KEY = '@leftovers_storage';

export const leftoverStorage = {
  async getAll(): Promise<Leftover[]> {
    try {
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
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(leftovers));
      }
    } catch (error) {
      console.log('Error saving leftovers:', error);
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


import { Leftover } from '@/types/leftover';

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
    leftovers.push(leftover);
    await this.save(leftovers);
  },

  async update(id: string, updates: Partial<Leftover>): Promise<void> {
    const leftovers = await this.getAll();
    const index = leftovers.findIndex(l => l.id === id);
    if (index !== -1) {
      leftovers[index] = { ...leftovers[index], ...updates };
      await this.save(leftovers);
    }
  },

  async delete(id: string): Promise<void> {
    const leftovers = await this.getAll();
    const filtered = leftovers.filter(l => l.id !== id);
    await this.save(filtered);
  },
};

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

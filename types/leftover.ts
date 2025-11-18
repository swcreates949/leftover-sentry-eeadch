
export interface Leftover {
  id: string;
  name: string;
  dateAdded: string;
  daysUntilExpiry: number;
  category?: string;
  notes?: string;
  notificationId?: string;
  imageUri?: string;
}

export const LEFTOVER_CATEGORIES = [
  'Meat',
  'Vegetables',
  'Dairy',
  'Prepared Meal',
  'Soup/Stew',
  'Dessert',
  'Other',
] as const;

export type LeftoverCategory = typeof LEFTOVER_CATEGORIES[number];

export const DEFAULT_EXPIRY_DAYS: Record<string, number> = {
  'Meat': 3,
  'Vegetables': 5,
  'Dairy': 7,
  'Prepared Meal': 4,
  'Soup/Stew': 4,
  'Dessert': 5,
  'Other': 3,
};

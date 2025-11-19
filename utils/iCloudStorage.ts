
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const ICLOUD_DIRECTORY = FileSystem.documentDirectory + 'iCloud/';

export const iCloudStorage = {
  isAvailable: (): boolean => {
    return Platform.OS === 'ios';
  },

  async saveToICloud(filename: string, data: string): Promise<boolean> {
    if (!iCloudStorage.isAvailable()) {
      console.log('iCloud storage is only available on iOS');
      return false;
    }

    try {
      const dirInfo = await FileSystem.getInfoAsync(ICLOUD_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(ICLOUD_DIRECTORY, { intermediates: true });
      }

      const filePath = ICLOUD_DIRECTORY + filename;
      await FileSystem.writeAsStringAsync(filePath, data);
      console.log('Saved to iCloud:', filePath);
      return true;
    } catch (error) {
      console.error('Error saving to iCloud:', error);
      return false;
    }
  },

  async loadFromICloud(filename: string): Promise<string | null> {
    if (!iCloudStorage.isAvailable()) {
      console.log('iCloud storage is only available on iOS');
      return null;
    }

    try {
      const filePath = ICLOUD_DIRECTORY + filename;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (!fileInfo.exists) {
        console.log('File does not exist in iCloud:', filePath);
        return null;
      }

      const data = await FileSystem.readAsStringAsync(filePath);
      console.log('Loaded from iCloud:', filePath);
      return data;
    } catch (error) {
      console.error('Error loading from iCloud:', error);
      return null;
    }
  },

  async deleteFromICloud(filename: string): Promise<boolean> {
    if (!iCloudStorage.isAvailable()) {
      console.log('iCloud storage is only available on iOS');
      return false;
    }

    try {
      const filePath = ICLOUD_DIRECTORY + filename;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
        console.log('Deleted from iCloud:', filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting from iCloud:', error);
      return false;
    }
  },

  async listICloudFiles(): Promise<string[]> {
    if (!iCloudStorage.isAvailable()) {
      console.log('iCloud storage is only available on iOS');
      return [];
    }

    try {
      const dirInfo = await FileSystem.getInfoAsync(ICLOUD_DIRECTORY);
      if (!dirInfo.exists) {
        return [];
      }

      const files = await FileSystem.readDirectoryAsync(ICLOUD_DIRECTORY);
      console.log('iCloud files:', files);
      return files;
    } catch (error) {
      console.error('Error listing iCloud files:', error);
      return [];
    }
  }
};

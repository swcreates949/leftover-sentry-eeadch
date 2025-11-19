
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const ICLOUD_FILENAME = 'leftovers-data.json';

export class ICloudStorage {
  private iCloudDirectory: string | null = null;
  private isAvailable: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (Platform.OS === 'ios') {
      try {
        // Check if iCloud is available
        const iCloudDir = FileSystem.documentDirectory + 'iCloud/';
        this.iCloudDirectory = iCloudDir;
        
        // Try to create the directory if it doesn't exist
        const dirInfo = await FileSystem.getInfoAsync(iCloudDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(iCloudDir, { intermediates: true });
        }
        
        this.isAvailable = true;
        console.log('iCloud storage initialized:', iCloudDir);
      } catch (error) {
        console.log('iCloud not available:', error);
        this.isAvailable = false;
      }
    }
  }

  async isICloudAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      return false;
    }
    
    // Re-check availability
    if (this.iCloudDirectory) {
      try {
        const dirInfo = await FileSystem.getInfoAsync(this.iCloudDirectory);
        this.isAvailable = dirInfo.exists;
      } catch (error) {
        console.log('Error checking iCloud availability:', error);
        this.isAvailable = false;
      }
    }
    
    return this.isAvailable;
  }

  private getFilePath(): string {
    return `${this.iCloudDirectory}${ICLOUD_FILENAME}`;
  }

  async readData<T>(): Promise<T | null> {
    if (!this.isAvailable || !this.iCloudDirectory) {
      console.log('iCloud not available for reading');
      return null;
    }

    try {
      const filePath = this.getFilePath();
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (!fileInfo.exists) {
        console.log('iCloud file does not exist yet');
        return null;
      }

      const content = await FileSystem.readAsStringAsync(filePath);
      const data = JSON.parse(content);
      console.log('Successfully read data from iCloud');
      return data as T;
    } catch (error) {
      console.log('Error reading from iCloud:', error);
      return null;
    }
  }

  async writeData<T>(data: T): Promise<boolean> {
    if (!this.isAvailable || !this.iCloudDirectory) {
      console.log('iCloud not available for writing');
      return false;
    }

    try {
      const filePath = this.getFilePath();
      const jsonString = JSON.stringify(data, null, 2);
      
      await FileSystem.writeAsStringAsync(filePath, jsonString);
      console.log('Successfully wrote data to iCloud');
      return true;
    } catch (error) {
      console.log('Error writing to iCloud:', error);
      return false;
    }
  }

  async deleteData(): Promise<boolean> {
    if (!this.isAvailable || !this.iCloudDirectory) {
      return false;
    }

    try {
      const filePath = this.getFilePath();
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
        console.log('Successfully deleted iCloud data');
      }
      return true;
    } catch (error) {
      console.log('Error deleting iCloud data:', error);
      return false;
    }
  }

  async getLastModified(): Promise<number | null> {
    if (!this.isAvailable || !this.iCloudDirectory) {
      return null;
    }

    try {
      const filePath = this.getFilePath();
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (fileInfo.exists && 'modificationTime' in fileInfo) {
        return fileInfo.modificationTime || null;
      }
      return null;
    } catch (error) {
      console.log('Error getting last modified time:', error);
      return null;
    }
  }
}

export const iCloudStorage = new ICloudStorage();

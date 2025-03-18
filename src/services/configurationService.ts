
import { storage } from './storage/unifiedStorage';

// Simple configuration service that could be expanded in the future
export const configurationService = {
  // General settings
  async getSettings<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const value = await storage.get(key) as T | null;
      return value !== null ? value : defaultValue;
    } catch (error) {
      console.error(`Error getting ${key} settings:`, error);
      return defaultValue;
    }
  },
  
  async saveSettings<T>(key: string, value: T): Promise<boolean> {
    try {
      await storage.set(key, value);
      return true;
    } catch (error) {
      console.error(`Error saving ${key} settings:`, error);
      return false;
    }
  }
};

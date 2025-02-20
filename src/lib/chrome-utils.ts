
import { toast } from "sonner";

export interface ChromeStorageData {
  preferences: Record<string, any>;
  subscriptions: Record<string, any>;
  bookmarks: Record<string, any>;
  installDate: number;
  hasRated: boolean;
  lastRatingPrompt: number;
}

export const getSecret = async (key: string): Promise<string | null> => {
  try {
    const result = await chrome.storage.sync.get(key);
    return result[key] || null;
  } catch (error) {
    console.error(`Error getting secret ${key}:`, error);
    return null;
  }
};

export const storage = {
  async get<T>(key: keyof ChromeStorageData): Promise<T | null> {
    try {
      const result = await chrome.storage.sync.get(key);
      return result[key] || null;
    } catch (error) {
      console.error('Error reading from chrome storage:', error);
      return null;
    }
  },

  async set(key: keyof ChromeStorageData, value: any): Promise<void> {
    try {
      await chrome.storage.sync.set({ [key]: value });
    } catch (error) {
      console.error('Error writing to chrome storage:', error);
      throw error;
    }
  },

  async remove(key: keyof ChromeStorageData): Promise<void> {
    try {
      await chrome.storage.sync.remove(key);
    } catch (error) {
      console.error('Error removing from chrome storage:', error);
      throw error;
    }
  }
};

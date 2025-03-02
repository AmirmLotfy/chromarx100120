
import { chromeDb } from '@/lib/chrome-storage';
import { retryWithBackoff } from '@/utils/retryUtils';
import { toast } from 'sonner';
import { dummyBookmarks } from '@/utils/dummyBookmarks';

export class StorageService {
  private static instance: StorageService;
  private cache = new Map<string, unknown>();
  private isExtension: boolean;

  private constructor() {
    // Check if we're running in a Chrome extension context
    this.isExtension = typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.sync;
    
    // Set up default cache for bookmarks
    this.cache.set('bookmarks', dummyBookmarks);
  }

  static getInstance(): StorageService {
    if (!this.instance) {
      this.instance = new StorageService();
    }
    return this.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // For bookmarks, we should always have a fallback to dummy bookmarks
      if (key === 'bookmarks' || key.includes('bookmark')) {
        if (this.cache.has(key)) {
          return this.cache.get(key) as T;
        }
        
        if (key === 'bookmarks' && (!this.cache.has(key) || (this.cache.get(key) as any[]).length === 0)) {
          console.log('No bookmarks in cache, returning dummy bookmarks');
          return dummyBookmarks as unknown as T;
        }
      }

      if (this.cache.has(key)) {
        return this.cache.get(key) as T;
      }

      if (!this.isExtension) {
        // If not in extension, try localStorage as fallback
        const stored = localStorage.getItem(key);
        const parsedValue = stored ? JSON.parse(stored) : null;
        
        // If retrieving bookmarks and got null or empty array, return dummy bookmarks
        if (key === 'bookmarks' && (!parsedValue || (Array.isArray(parsedValue) && parsedValue.length === 0))) {
          return dummyBookmarks as unknown as T;
        }
        
        return parsedValue;
      }

      const result = await chrome.storage.sync.get(key);
      const value = result[key] || null;
      
      if (value !== null) {
        this.cache.set(key, value);
      }
      
      // If retrieving bookmarks and got null or empty array, return dummy bookmarks
      if (key === 'bookmarks' && (!value || (Array.isArray(value) && value.length === 0))) {
        return dummyBookmarks as unknown as T;
      }
      
      return value as T;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      toast.error(`Failed to read ${key} from storage`);
      
      // If error retrieving bookmarks, return dummy bookmarks
      if (key === 'bookmarks') {
        return dummyBookmarks as unknown as T;
      }
      
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      if (!this.isExtension) {
        // If not in extension, use localStorage as fallback
        localStorage.setItem(key, JSON.stringify(value));
        this.cache.set(key, value);
        return;
      }

      await chrome.storage.sync.set({ [key]: value });
      this.cache.set(key, value);
    } catch (error) {
      console.error(`Error writing ${key} to storage:`, error);
      toast.error(`Failed to write ${key} to storage`);
      throw error;
    }
  }

  async update<T extends Record<string, any>>(key: string, value: Partial<T>): Promise<void> {
    try {
      const current = await this.get<T>(key);
      const updated = { ...current, ...value };
      await this.set(key, updated);
    } catch (error) {
      console.error(`Error updating ${key} in storage:`, error);
      toast.error(`Failed to update ${key} in storage`);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      if (!this.isExtension) {
        localStorage.removeItem(key);
        this.cache.delete(key);
        return;
      }

      await chrome.storage.sync.remove(key);
      this.cache.delete(key);
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
      toast.error(`Failed to remove ${key} from storage`);
      throw error;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const storage = StorageService.getInstance();

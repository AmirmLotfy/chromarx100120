
import { IStorageProvider, StorageArea, StorageItem, StorageOptions } from './types';
import { isExtensionEnvironment } from '@/utils/environmentUtils';

const DEFAULT_OPTIONS: StorageOptions = {
  area: 'local',
  encrypt: false,
  cacheInMemory: true
};

/**
 * Simple encryption for sensitive data (not for high security needs)
 */
const encryptData = (data: any): string => {
  try {
    const jsonStr = JSON.stringify(data);
    return btoa(jsonStr); // Simple base64 encoding
  } catch (error) {
    console.error('Error encrypting data:', error);
    return '';
  }
};

const decryptData = (encryptedData: string): any => {
  try {
    const jsonStr = atob(encryptedData); // Simple base64 decoding
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error decrypting data:', error);
    return null;
  }
};

export class ChromeStorageProvider implements IStorageProvider {
  private memoryCache: Map<string, StorageItem<any>> = new Map();
  
  /**
   * Get data from Chrome storage
   */
  async get<T>(key: string, options: StorageOptions = DEFAULT_OPTIONS): Promise<T | null> {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    
    // Check memory cache first if enabled
    if (mergedOptions.cacheInMemory) {
      const cached = this.memoryCache.get(key);
      if (cached) {
        // Check expiry if it exists
        if (cached.expiry && cached.expiry < Date.now()) {
          this.memoryCache.delete(key);
        } else {
          return cached.value as T;
        }
      }
    }
    
    try {
      // If we're not in a Chrome extension environment, fall back to localStorage
      if (!isExtensionEnvironment()) {
        return this.getFromLocalStorage<T>(key, mergedOptions);
      }
      
      const storageArea = mergedOptions.area || 'local';
      
      // Use Chrome storage API
      const result = await chrome.storage[storageArea].get(key);
      
      if (!result[key]) {
        return null;
      }
      
      let value: any = result[key];
      
      // If it's an StorageItem, extract the value and check expiry
      if (value && typeof value === 'object' && 'value' in value && 'timestamp' in value) {
        const item = value as StorageItem<T>;
        
        // Check if expired
        if (item.expiry && item.expiry < Date.now()) {
          await this.remove(key, mergedOptions);
          return null;
        }
        
        value = item.value;
      }
      
      // Handle encrypted data
      if (mergedOptions.encrypt && typeof value === 'string') {
        value = decryptData(value);
      }
      
      // Cache in memory if enabled
      if (mergedOptions.cacheInMemory) {
        this.memoryCache.set(key, {
          value,
          expiry: null,
          timestamp: Date.now()
        });
      }
      
      return value as T;
    } catch (error) {
      console.error(`Error getting data for key ${key}:`, error);
      
      // Try local storage as fallback
      return this.getFromLocalStorage<T>(key, mergedOptions);
    }
  }
  
  /**
   * Set data in Chrome storage
   */
  async set<T>(key: string, value: T, options: StorageOptions = DEFAULT_OPTIONS): Promise<boolean> {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    
    try {
      // Prepare the storage item
      let valueToStore: any = value;
      
      // If TTL is specified, create a storage item with expiry
      if (mergedOptions.ttl) {
        const expiryTime = Date.now() + mergedOptions.ttl * 60 * 1000;
        
        valueToStore = {
          value,
          expiry: expiryTime,
          timestamp: Date.now(),
          version: 1
        } as StorageItem<T>;
      } else if (typeof value === 'object') {
        // For objects, always use the StorageItem format for consistency
        valueToStore = {
          value,
          expiry: null,
          timestamp: Date.now(),
          version: 1
        } as StorageItem<T>;
      }
      
      // Handle encrypted data
      if (mergedOptions.encrypt) {
        valueToStore = encryptData(valueToStore);
      }
      
      // Update memory cache if enabled
      if (mergedOptions.cacheInMemory) {
        this.memoryCache.set(key, {
          value,
          expiry: mergedOptions.ttl ? Date.now() + mergedOptions.ttl * 60 * 1000 : null,
          timestamp: Date.now()
        });
      }
      
      // If we're not in a Chrome extension environment, use localStorage
      if (!isExtensionEnvironment()) {
        return this.setInLocalStorage(key, valueToStore, mergedOptions);
      }
      
      const storageArea = mergedOptions.area || 'local';
      
      // Use Chrome storage API
      await chrome.storage[storageArea].set({ [key]: valueToStore });
      return true;
    } catch (error) {
      console.error(`Error setting data for key ${key}:`, error);
      
      // Try local storage as fallback
      return this.setInLocalStorage(key, value, mergedOptions);
    }
  }
  
  /**
   * Update an existing object in storage
   */
  async update<T extends object>(key: string, partialValue: Partial<T>, options: StorageOptions = DEFAULT_OPTIONS): Promise<boolean> {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    
    try {
      // Get the current value
      const currentValue = await this.get<T>(key, mergedOptions);
      
      if (!currentValue) {
        // If no current value, just set the partial value
        return this.set(key, partialValue as T, mergedOptions);
      }
      
      // Merge current and partial values
      const updatedValue = { ...currentValue, ...partialValue };
      
      // Save the updated value
      return this.set(key, updatedValue, mergedOptions);
    } catch (error) {
      console.error(`Error updating data for key ${key}:`, error);
      return false;
    }
  }
  
  /**
   * Remove data from Chrome storage
   */
  async remove(key: string, options: StorageOptions = DEFAULT_OPTIONS): Promise<boolean> {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    
    try {
      // Remove from memory cache
      this.memoryCache.delete(key);
      
      // If we're not in a Chrome extension environment, use localStorage
      if (!isExtensionEnvironment()) {
        localStorage.removeItem(key);
        return true;
      }
      
      const storageArea = mergedOptions.area || 'local';
      
      // Use Chrome storage API
      await chrome.storage[storageArea].remove(key);
      return true;
    } catch (error) {
      console.error(`Error removing data for key ${key}:`, error);
      
      // Try local storage as fallback
      localStorage.removeItem(key);
      return false;
    }
  }
  
  /**
   * Clear all data from a storage area
   */
  async clear(options: StorageOptions = DEFAULT_OPTIONS): Promise<boolean> {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    
    try {
      // Clear memory cache
      this.memoryCache.clear();
      
      // If we're not in a Chrome extension environment, use localStorage
      if (!isExtensionEnvironment()) {
        localStorage.clear();
        return true;
      }
      
      const storageArea = mergedOptions.area || 'local';
      
      // Use Chrome storage API
      await chrome.storage[storageArea].clear();
      return true;
    } catch (error) {
      console.error(`Error clearing ${mergedOptions.area} storage:`, error);
      
      // Try local storage as fallback
      localStorage.clear();
      return false;
    }
  }
  
  /**
   * List all keys in a storage area
   */
  async listKeys(options: StorageOptions = DEFAULT_OPTIONS): Promise<string[]> {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    
    try {
      // If we're not in a Chrome extension environment, use localStorage
      if (!isExtensionEnvironment()) {
        return Object.keys(localStorage);
      }
      
      const storageArea = mergedOptions.area || 'local';
      
      // Use Chrome storage API
      const allData = await chrome.storage[storageArea].get(null);
      return Object.keys(allData);
    } catch (error) {
      console.error(`Error listing keys in ${mergedOptions.area} storage:`, error);
      
      // Try local storage as fallback
      return Object.keys(localStorage);
    }
  }
  
  /**
   * Get data from localStorage
   */
  private getFromLocalStorage<T>(key: string, options: StorageOptions): T | null {
    try {
      const data = localStorage.getItem(key);
      
      if (!data) {
        return null;
      }
      
      let parsed = JSON.parse(data);
      
      // If it's a StorageItem, extract the value and check expiry
      if (parsed && typeof parsed === 'object' && 'value' in parsed && 'timestamp' in parsed) {
        const item = parsed as StorageItem<T>;
        
        // Check if expired
        if (item.expiry && item.expiry < Date.now()) {
          localStorage.removeItem(key);
          return null;
        }
        
        parsed = item.value;
      }
      
      // Handle encrypted data
      if (options.encrypt && typeof parsed === 'string') {
        parsed = decryptData(parsed);
      }
      
      return parsed as T;
    } catch (error) {
      console.error(`Error getting data from localStorage for key ${key}:`, error);
      return null;
    }
  }
  
  /**
   * Set data in localStorage
   */
  private setInLocalStorage<T>(key: string, value: T, options: StorageOptions): boolean {
    try {
      let valueToStore = value;
      
      // If TTL is specified, create a storage item with expiry
      if (options.ttl) {
        const expiryTime = Date.now() + options.ttl * 60 * 1000;
        
        valueToStore = {
          value,
          expiry: expiryTime,
          timestamp: Date.now(),
          version: 1
        } as unknown as T;
      }
      
      // Handle encrypted data
      if (options.encrypt) {
        valueToStore = encryptData(valueToStore) as unknown as T;
      }
      
      localStorage.setItem(key, JSON.stringify(valueToStore));
      return true;
    } catch (error) {
      console.error(`Error setting data in localStorage for key ${key}:`, error);
      return false;
    }
  }
}

export const chromeStorageProvider = new ChromeStorageProvider();

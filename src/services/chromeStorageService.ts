
/**
 * Chrome Storage Service
 * Provides a consistent API for storing and retrieving data in Chrome's storage
 */
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

// Define types
type StorageArea = 'sync' | 'local' | 'managed' | 'session';

export interface StorageOptions {
  area?: StorageArea;
  encrypt?: boolean;
}

const defaultOptions: StorageOptions = {
  area: 'local',
  encrypt: false
};

// Simple encryption for sensitive data (not for high security needs)
const encryptData = (data: any, key: string): string => {
  // This is a very simple encryption just to obscure the data
  // For production, consider using the SubtleCrypto API
  try {
    const jsonStr = JSON.stringify(data);
    return btoa(jsonStr); // Simple base64 encoding
  } catch (error) {
    console.error('Error encrypting data:', error);
    return '';
  }
};

const decryptData = (encryptedData: string, key: string): any => {
  try {
    const jsonStr = atob(encryptedData); // Simple base64 decoding
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error decrypting data:', error);
    return null;
  }
};

export const chromeStorage = {
  /**
   * Get data from Chrome storage
   */
  async get<T>(key: string, options: StorageOptions = defaultOptions): Promise<T | null> {
    try {
      const storageArea = options.area || 'local';
      
      // Use Chrome storage API to retrieve data
      const result = await chrome.storage[storageArea].get(key);
      
      if (!result[key]) {
        return null;
      }
      
      // Handle encrypted data
      if (options.encrypt) {
        return decryptData(result[key], key);
      }
      
      return result[key] as T;
    } catch (error) {
      console.error(`Error getting data for key ${key}:`, error);
      return null;
    }
  },
  
  /**
   * Set data in Chrome storage
   */
  async set<T>(key: string, data: T, options: StorageOptions = defaultOptions): Promise<boolean> {
    try {
      const storageArea = options.area || 'local';
      let dataToStore = data;
      
      // Handle encrypted data
      if (options.encrypt && data) {
        dataToStore = encryptData(data, key) as unknown as T;
      }
      
      // Use Chrome storage API to store data
      await chrome.storage[storageArea].set({ [key]: dataToStore });
      return true;
    } catch (error) {
      console.error(`Error setting data for key ${key}:`, error);
      toast.error("Failed to save data");
      return false;
    }
  },
  
  /**
   * Remove data from Chrome storage
   */
  async remove(key: string, options: StorageOptions = defaultOptions): Promise<boolean> {
    try {
      const storageArea = options.area || 'local';
      await chrome.storage[storageArea].remove(key);
      return true;
    } catch (error) {
      console.error(`Error removing data for key ${key}:`, error);
      return false;
    }
  },
  
  /**
   * Clear all data from a storage area
   */
  async clear(options: StorageOptions = defaultOptions): Promise<boolean> {
    try {
      const storageArea = options.area || 'local';
      await chrome.storage[storageArea].clear();
      return true;
    } catch (error) {
      console.error(`Error clearing ${storageArea} storage:`, error);
      return false;
    }
  },
  
  /**
   * List all keys in a storage area
   */
  async listKeys(options: StorageOptions = defaultOptions): Promise<string[]> {
    try {
      const storageArea = options.area || 'local';
      const allData = await chrome.storage[storageArea].get(null);
      return Object.keys(allData);
    } catch (error) {
      console.error(`Error listing keys in ${options.area} storage:`, error);
      return [];
    }
  },
  
  /**
   * Database-like operations
   */
  db: {
    /**
     * Create a new record in a collection
     */
    async insert<T extends { id?: string }>(collection: string, data: T): Promise<T> {
      try {
        // Generate ID if not provided
        const newData = { 
          ...data,
          id: data.id || uuidv4(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Get existing collection
        const existingData = await chromeStorage.get<T[]>(collection) || [];
        
        // Add new item
        const updatedData = [...existingData, newData];
        
        // Save updated collection
        await chromeStorage.set(collection, updatedData);
        
        return newData as T;
      } catch (error) {
        console.error(`Error inserting data into ${collection}:`, error);
        throw error;
      }
    },
    
    /**
     * Update an existing record
     */
    async update<T extends { id: string }>(collection: string, id: string, data: Partial<T>): Promise<T | null> {
      try {
        // Get existing collection
        const existingData = await chromeStorage.get<T[]>(collection) || [];
        
        // Find the item to update
        const index = existingData.findIndex(item => (item as any).id === id);
        
        if (index === -1) {
          return null;
        }
        
        // Update the item
        const updatedItem = {
          ...existingData[index],
          ...data,
          updated_at: new Date().toISOString()
        };
        
        existingData[index] = updatedItem;
        
        // Save updated collection
        await chromeStorage.set(collection, existingData);
        
        return updatedItem as T;
      } catch (error) {
        console.error(`Error updating data in ${collection}:`, error);
        throw error;
      }
    },
    
    /**
     * Delete a record
     */
    async delete(collection: string, id: string): Promise<boolean> {
      try {
        // Get existing collection
        const existingData = await chromeStorage.get<any[]>(collection) || [];
        
        // Filter out the item to delete
        const updatedData = existingData.filter(item => item.id !== id);
        
        // Check if item was found and removed
        if (updatedData.length === existingData.length) {
          return false;
        }
        
        // Save updated collection
        await chromeStorage.set(collection, updatedData);
        
        return true;
      } catch (error) {
        console.error(`Error deleting data from ${collection}:`, error);
        throw error;
      }
    },
    
    /**
     * Query records in a collection
     */
    async query<T>(collection: string, queryFn: (item: T) => boolean): Promise<T[]> {
      try {
        // Get existing collection
        const existingData = await chromeStorage.get<T[]>(collection) || [];
        
        // Filter based on query function
        return existingData.filter(queryFn);
      } catch (error) {
        console.error(`Error querying data in ${collection}:`, error);
        return [];
      }
    }
  }
};

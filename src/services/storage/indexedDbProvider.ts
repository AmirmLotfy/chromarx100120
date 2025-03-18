
import { IStorageDatabase, DatabaseOptions } from './types';

const DEFAULT_DB_NAME = 'chromarx_storage';
const DEFAULT_OPTIONS: DatabaseOptions = {
  storeName: 'default',
  useIndices: [],
  version: 1
};

export class IndexedDbProvider implements IStorageDatabase {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private dbInitPromise: Promise<IDBDatabase> | null = null;
  
  constructor(dbName: string = DEFAULT_DB_NAME) {
    this.dbName = dbName;
    this.db = null;
  }
  
  /**
   * Initialize the database
   */
  private async initDb(options: DatabaseOptions = DEFAULT_OPTIONS): Promise<IDBDatabase> {
    // Return existing initialization promise if it exists
    if (this.dbInitPromise) {
      return this.dbInitPromise;
    }
    
    // Create a new initialization promise
    this.dbInitPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, options.version || 1);
      
      request.onerror = (event) => {
        console.error('Error opening IndexedDB:', event);
        reject(new Error('Failed to open IndexedDB'));
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create the object store if it doesn't exist
        if (!db.objectStoreNames.contains(options.storeName)) {
          const store = db.createObjectStore(options.storeName, { keyPath: 'id' });
          
          // Create indices if specified
          if (options.useIndices) {
            for (const index of options.useIndices) {
              store.createIndex(index, index, { unique: false });
            }
          }
        }
      };
    });
    
    return this.dbInitPromise;
  }
  
  /**
   * Get a transaction for the specified store
   */
  private async getTransaction(
    storeName: string, 
    mode: IDBTransactionMode = 'readonly'
  ): Promise<IDBObjectStore> {
    const db = await this.initDb({ storeName });
    const transaction = db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }
  
  /**
   * Get an item by ID
   */
  async get<T>(id: string, options: DatabaseOptions = DEFAULT_OPTIONS): Promise<T | null> {
    try {
      const store = await this.getTransaction(options.storeName || DEFAULT_OPTIONS.storeName);
      
      return new Promise<T | null>((resolve, reject) => {
        const request = store.get(id);
        
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        
        request.onerror = (event) => {
          console.error('Error getting item from IndexedDB:', event);
          reject(new Error('Failed to get item from IndexedDB'));
        };
      });
    } catch (error) {
      console.error('Error in get operation:', error);
      return null;
    }
  }
  
  /**
   * Get all items from the store
   */
  async getAll<T>(options: DatabaseOptions = DEFAULT_OPTIONS): Promise<T[]> {
    try {
      const store = await this.getTransaction(options.storeName || DEFAULT_OPTIONS.storeName);
      
      return new Promise<T[]>((resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
          resolve(request.result || []);
        };
        
        request.onerror = (event) => {
          console.error('Error getting all items from IndexedDB:', event);
          reject(new Error('Failed to get all items from IndexedDB'));
        };
      });
    } catch (error) {
      console.error('Error in getAll operation:', error);
      return [];
    }
  }
  
  /**
   * Query items using a filter function
   * Note: This loads all items into memory and filters them
   */
  async query<T>(queryFn: (item: T) => boolean, options: DatabaseOptions = DEFAULT_OPTIONS): Promise<T[]> {
    try {
      const allItems = await this.getAll<T>(options);
      return allItems.filter(queryFn);
    } catch (error) {
      console.error('Error in query operation:', error);
      return [];
    }
  }
  
  /**
   * Add an item to the store
   */
  async add<T>(data: T, options: DatabaseOptions = DEFAULT_OPTIONS): Promise<string | number> {
    try {
      const store = await this.getTransaction(options.storeName || DEFAULT_OPTIONS.storeName, 'readwrite');
      
      return new Promise<string | number>((resolve, reject) => {
        // Ensure the data has an ID
        const dataWithId = this.ensureId(data);
        
        const request = store.put(dataWithId);
        
        request.onsuccess = () => {
          resolve(request.result as string | number);
        };
        
        request.onerror = (event) => {
          console.error('Error adding item to IndexedDB:', event);
          reject(new Error('Failed to add item to IndexedDB'));
        };
      });
    } catch (error) {
      console.error('Error in add operation:', error);
      throw error;
    }
  }
  
  /**
   * Update an item in the store
   */
  async update<T>(id: string, data: Partial<T>, options: DatabaseOptions = DEFAULT_OPTIONS): Promise<boolean> {
    try {
      const store = await this.getTransaction(options.storeName || DEFAULT_OPTIONS.storeName, 'readwrite');
      
      // Get the existing item
      const existingItem = await this.get<T>(id, options);
      
      if (!existingItem) {
        return false;
      }
      
      // Merge existing item with updates
      const updatedItem = { ...existingItem, ...data, id };
      
      return new Promise<boolean>((resolve, reject) => {
        const request = store.put(updatedItem);
        
        request.onsuccess = () => {
          resolve(true);
        };
        
        request.onerror = (event) => {
          console.error('Error updating item in IndexedDB:', event);
          reject(new Error('Failed to update item in IndexedDB'));
        };
      });
    } catch (error) {
      console.error('Error in update operation:', error);
      return false;
    }
  }
  
  /**
   * Delete an item from the store
   */
  async delete(id: string, options: DatabaseOptions = DEFAULT_OPTIONS): Promise<boolean> {
    try {
      const store = await this.getTransaction(options.storeName || DEFAULT_OPTIONS.storeName, 'readwrite');
      
      return new Promise<boolean>((resolve, reject) => {
        const request = store.delete(id);
        
        request.onsuccess = () => {
          resolve(true);
        };
        
        request.onerror = (event) => {
          console.error('Error deleting item from IndexedDB:', event);
          reject(new Error('Failed to delete item from IndexedDB'));
        };
      });
    } catch (error) {
      console.error('Error in delete operation:', error);
      return false;
    }
  }
  
  /**
   * Clear all items from the store
   */
  async clear(options: DatabaseOptions = DEFAULT_OPTIONS): Promise<boolean> {
    try {
      const store = await this.getTransaction(options.storeName || DEFAULT_OPTIONS.storeName, 'readwrite');
      
      return new Promise<boolean>((resolve, reject) => {
        const request = store.clear();
        
        request.onsuccess = () => {
          resolve(true);
        };
        
        request.onerror = (event) => {
          console.error('Error clearing store in IndexedDB:', event);
          reject(new Error('Failed to clear store in IndexedDB'));
        };
      });
    } catch (error) {
      console.error('Error in clear operation:', error);
      return false;
    }
  }
  
  /**
   * Ensure the data has an ID
   */
  private ensureId<T>(data: T): T & { id: string | number } {
    if ((data as any).id) {
      return data as T & { id: string | number };
    }
    
    // Generate a random ID if none exists
    return {
      ...data as object,
      id: crypto.randomUUID() || `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    } as T & { id: string | number };
  }
}

export const indexedDbProvider = new IndexedDbProvider();

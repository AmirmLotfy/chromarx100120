
import { toast } from "sonner";
import { Json } from "@/lib/json-types";

export type StorageOptions = {
  dbName: string;
  version: number;
  stores: {
    name: string;
    keyPath: string;
    indices?: Array<{
      name: string;
      keyPath: string | string[];
      unique: boolean;
      multiEntry?: boolean;
    }>;
  }[];
};

/**
 * Enhanced IndexedDB service for handling large datasets efficiently
 * Provides better transaction management, bulk operations, and cursor-based processing
 */
export class EnhancedIndexedDbService {
  private static instance: EnhancedIndexedDbService;
  private db: IDBDatabase | null = null;
  private dbName: string;
  private dbVersion: number;
  private stores: StorageOptions['stores'];
  private dbOpenPromise: Promise<IDBDatabase> | null = null;
  private _isInitialized = false;

  private constructor(options: StorageOptions) {
    this.dbName = options.dbName;
    this.dbVersion = options.version;
    this.stores = options.stores;
  }

  static getInstance(options?: StorageOptions): EnhancedIndexedDbService {
    if (!this.instance) {
      if (!options) {
        throw new Error('EnhancedIndexedDbService must be initialized with options first');
      }
      this.instance = new EnhancedIndexedDbService(options);
    }
    return this.instance;
  }

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Initialize the database
   * This must be called before any other operations
   */
  async initialize(): Promise<void> {
    try {
      await this.openDatabase();
      this._isInitialized = true;
      console.log(`IndexedDB '${this.dbName}' initialized successfully`);
    } catch (error) {
      console.error(`Failed to initialize IndexedDB '${this.dbName}':`, error);
      throw error;
    }
  }

  /**
   * Open the database connection
   */
  private async openDatabase(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    
    if (this.dbOpenPromise) return this.dbOpenPromise;
    
    this.dbOpenPromise = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(this.dbName, this.dbVersion);
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          // Create or update stores defined in options
          for (const store of this.stores) {
            // Check if object store already exists
            if (!db.objectStoreNames.contains(store.name)) {
              const objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath });
              
              // Create indices
              if (store.indices) {
                for (const index of store.indices) {
                  objectStore.createIndex(
                    index.name, 
                    index.keyPath, 
                    { 
                      unique: index.unique,
                      multiEntry: index.multiEntry || false
                    }
                  );
                }
              }
              
              console.log(`Created object store: ${store.name}`);
            } else {
              console.log(`Object store already exists: ${store.name}`);
              
              // Add any new indices to existing store
              const transaction = (event as any).target.transaction;
              const objectStore = transaction.objectStore(store.name);
              
              if (store.indices) {
                for (const index of store.indices) {
                  // Check if index already exists
                  if (!objectStore.indexNames.contains(index.name)) {
                    objectStore.createIndex(
                      index.name, 
                      index.keyPath, 
                      { 
                        unique: index.unique,
                        multiEntry: index.multiEntry || false
                      }
                    );
                    console.log(`Added index ${index.name} to ${store.name}`);
                  }
                }
              }
            }
          }
        };
        
        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          
          // Set up error handling on the database
          this.db.onerror = (event) => {
            console.error("IndexedDB error:", event);
          };
          
          resolve(this.db);
          this.dbOpenPromise = null;
        };
        
        request.onerror = (event) => {
          console.error('Error opening IndexedDB:', event);
          reject(new Error('Failed to open IndexedDB'));
          this.dbOpenPromise = null;
        };
      } catch (error) {
        console.error("Error in openDatabase:", error);
        reject(error);
        this.dbOpenPromise = null;
      }
    });
    
    return this.dbOpenPromise;
  }

  /**
   * Close the database connection
   */
  async closeDatabase(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this._isInitialized = false;
      console.log(`IndexedDB '${this.dbName}' closed`);
    }
  }

  /**
   * Add an item to a store
   */
  async add<T extends Record<string, Json>>(
    storeName: string, 
    item: T
  ): Promise<IDBValidKey> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const request = store.add(item);
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = () => {
          reject(request.error);
        };
        
        // Handle transaction errors
        transaction.onerror = (event) => {
          reject(new Error(`Transaction error: ${(event.target as any)?.error?.message || "Unknown error"}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Update or insert an item
   */
  async put<T extends Record<string, Json>>(
    storeName: string, 
    item: T
  ): Promise<IDBValidKey> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const request = store.put(item);
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = () => {
          reject(request.error);
        };
        
        transaction.onerror = (event) => {
          reject(new Error(`Transaction error: ${(event.target as any)?.error?.message || "Unknown error"}`));
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get an item by its primary key
   */
  async get<T>(
    storeName: string, 
    key: IDBValidKey
  ): Promise<T | null> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        
        const request = store.get(key);
        
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        
        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get all items from a store
   */
  async getAll<T>(
    storeName: string, 
    query?: IDBValidKey | IDBKeyRange, 
    count?: number
  ): Promise<T[]> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        
        const request = store.getAll(query, count);
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get items by index
   */
  async getByIndex<T>(
    storeName: string, 
    indexName: string, 
    query: IDBValidKey | IDBKeyRange,
    count?: number
  ): Promise<T[]> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        
        const request = index.getAll(query, count);
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Delete an item by its primary key
   */
  async delete(
    storeName: string, 
    key: IDBValidKey
  ): Promise<void> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const request = store.delete(key);
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Clear all data in a store
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const request = store.clear();
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Count items in a store
   */
  async count(
    storeName: string, 
    query?: IDBValidKey | IDBKeyRange
  ): Promise<number> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        
        const request = store.count(query);
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = () => {
          reject(request.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Perform bulk operations with chunking to avoid transaction timeouts
   * This is especially useful for large datasets
   */
  async bulkPut<T extends Record<string, Json>>(
    storeName: string, 
    items: T[], 
    options: { 
      chunkSize?: number,
      onProgress?: (processed: number, total: number) => void 
    } = {}
  ): Promise<void> {
    if (!items.length) return;
    
    const chunkSize = options.chunkSize || 100;
    const total = items.length;
    let processed = 0;
    
    // Process in chunks to avoid transaction timeouts
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const db = await this.openDatabase();
      
      await new Promise<void>((resolve, reject) => {
        try {
          const transaction = db.transaction(storeName, 'readwrite');
          const store = transaction.objectStore(storeName);
          
          transaction.oncomplete = () => {
            processed += chunk.length;
            
            if (options.onProgress) {
              options.onProgress(processed, total);
            }
            
            resolve();
          };
          
          transaction.onerror = () => {
            reject(transaction.error);
          };
          
          chunk.forEach(item => {
            store.put(item);
          });
        } catch (error) {
          reject(error);
        }
      });
    }
  }

  /**
   * Process items using a cursor with transaction batching
   * This is very efficient for processing large datasets
   */
  async processByCursor<T extends Record<string, Json>>(
    storeName: string, 
    callback: (item: T) => Promise<T | null> | T | null,
    options: { 
      query?: IDBValidKey | IDBKeyRange,
      index?: string,
      direction?: IDBCursorDirection,
      batchSize?: number,
      onProgress?: (processed: number, total: number) => void,
      signal?: AbortSignal
    } = {}
  ): Promise<void> {
    const db = await this.openDatabase();
    const batchSize = options.batchSize || 50;
    
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Check for abort signal
        if (options.signal?.aborted) {
          reject(new DOMException("Operation aborted", "AbortError"));
          return;
        }
        
        // Add abort listener
        const abortListener = () => {
          reject(new DOMException("Operation aborted", "AbortError"));
        };
        
        if (options.signal) {
          options.signal.addEventListener("abort", abortListener);
        }
        
        // Count total items for progress reporting
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const source = options.index 
          ? store.index(options.index)
          : store;
          
        const countRequest = source.count(options.query);
        
        countRequest.onsuccess = async () => {
          const total = countRequest.result;
          let processed = 0;
          
          // Start a new transaction for the cursor operation
          const cursorTx = db.transaction(storeName, 'readwrite');
          const cursorStore = cursorTx.objectStore(storeName);
          const cursorSource = options.index 
            ? cursorStore.index(options.index)
            : cursorStore;
            
          const openCursorRequest = cursorSource.openCursor(
            options.query, 
            options.direction
          );
          
          let batch: T[] = [];
          let updates: Array<{ key: IDBValidKey, value: T }> = [];
          
          openCursorRequest.onsuccess = async (event) => {
            try {
              const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
              
              // Check for abort signal during processing
              if (options.signal?.aborted) {
                if (options.signal) {
                  options.signal.removeEventListener("abort", abortListener);
                }
                reject(new DOMException("Operation aborted", "AbortError"));
                return;
              }
              
              if (cursor) {
                const item = cursor.value as T;
                batch.push(item);
                
                // Process batch when it reaches batchSize
                if (batch.length >= batchSize) {
                  // Process all items in the current batch
                  for (const batchItem of batch) {
                    try {
                      const result = await callback(batchItem);
                      if (result !== null) {
                        updates.push({ key: cursor.primaryKey, value: result });
                      }
                    } catch (error) {
                      console.error("Error processing item:", error);
                    }
                  }
                  
                  // Apply all updates
                  for (const update of updates) {
                    cursorStore.put(update.value);
                  }
                  
                  processed += batch.length;
                  
                  if (options.onProgress) {
                    options.onProgress(processed, total);
                  }
                  
                  // Clear batch and updates for next round
                  batch = [];
                  updates = [];
                }
                
                cursor.continue();
              } else {
                // Process remaining items in the final batch
                for (const batchItem of batch) {
                  try {
                    const result = await callback(batchItem);
                    if (result !== null) {
                      cursorStore.put(result);
                    }
                    processed++;
                  } catch (error) {
                    console.error("Error processing final batch item:", error);
                  }
                }
                
                if (options.onProgress) {
                  options.onProgress(processed, total);
                }
                
                if (options.signal) {
                  options.signal.removeEventListener("abort", abortListener);
                }
                
                resolve();
              }
            } catch (error) {
              if (options.signal) {
                options.signal.removeEventListener("abort", abortListener);
              }
              reject(error);
            }
          };
          
          openCursorRequest.onerror = () => {
            if (options.signal) {
              options.signal.removeEventListener("abort", abortListener);
            }
            reject(openCursorRequest.error);
          };
        };
        
        countRequest.onerror = () => {
          if (options.signal) {
            options.signal.removeEventListener("abort", abortListener);
          }
          reject(countRequest.error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create a compound index key
   * Useful for more complex queries
   */
  createCompoundKey(...values: any[]): any[] {
    return values;
  }

  /**
   * Create a key range for querying
   */
  createKeyRange(
    options: {
      lower?: any,
      upper?: any,
      lowerOpen?: boolean,
      upperOpen?: boolean
    } | {
      only: any
    } | {
      lowerBound: any,
      open?: boolean
    } | {
      upperBound: any,
      open?: boolean
    }
  ): IDBKeyRange {
    if ('only' in options) {
      return IDBKeyRange.only(options.only);
    } else if ('lowerBound' in options) {
      return IDBKeyRange.lowerBound(options.lowerBound, options.open);
    } else if ('upperBound' in options) {
      return IDBKeyRange.upperBound(options.upperBound, options.open);
    } else {
      return IDBKeyRange.bound(
        options.lower, 
        options.upper, 
        options.lowerOpen, 
        options.upperOpen
      );
    }
  }
}

// Initialize an enhanced bookmark database service
const enhancedBookmarkDb = EnhancedIndexedDbService.getInstance({
  dbName: 'enhanced-bookmark-manager-db',
  version: 1,
  stores: [
    {
      name: 'bookmarks',
      keyPath: 'id',
      indices: [
        { name: 'url', keyPath: 'url', unique: false },
        { name: 'title', keyPath: 'title', unique: false },
        { name: 'category', keyPath: 'category', unique: false },
        { name: 'dateAdded', keyPath: 'dateAdded', unique: false },
        { name: 'tags', keyPath: 'tags', unique: false, multiEntry: true },
        { name: 'domain', keyPath: 'domain', unique: false },
        { name: 'content', keyPath: 'content', unique: false },
        { name: 'syncStatus', keyPath: 'metadata.syncStatus', unique: false }
      ]
    },
    {
      name: 'categories',
      keyPath: 'id',
      indices: [
        { name: 'name', keyPath: 'name', unique: true }
      ]
    },
    {
      name: 'tags',
      keyPath: 'id',
      indices: [
        { name: 'name', keyPath: 'name', unique: true }
      ]
    },
    {
      name: 'searches',
      keyPath: 'id',
      indices: [
        { name: 'query', keyPath: 'query', unique: false },
        { name: 'timestamp', keyPath: 'timestamp', unique: false }
      ]
    },
    {
      name: 'syncQueue',
      keyPath: 'id',
      indices: [
        { name: 'type', keyPath: 'type', unique: false },
        { name: 'timestamp', keyPath: 'timestamp', unique: false },
        { name: 'status', keyPath: 'status', unique: false }
      ]
    },
    {
      name: 'conversations',
      keyPath: 'id',
      indices: [
        { name: 'createdAt', keyPath: 'createdAt', unique: false },
        { name: 'updatedAt', keyPath: 'updatedAt', unique: false },
        { name: 'category', keyPath: 'category', unique: false }
      ]
    }
  ]
});

export { enhancedBookmarkDb };

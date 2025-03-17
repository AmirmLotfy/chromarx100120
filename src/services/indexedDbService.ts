
import { toast } from "sonner";
import { ChromeBookmark } from "@/types/bookmark";

interface IndexedDBOptions {
  dbName: string;
  version: number;
  stores: {
    name: string;
    keyPath: string;
    indices?: { name: string; keyPath: string; unique: boolean }[];
  }[];
}

interface QueryOptions {
  index?: string;
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export class IndexedDBService {
  private static instance: IndexedDBService;
  private db: IDBDatabase | null = null;
  private dbName: string;
  private dbVersion: number;
  private stores: IndexedDBOptions['stores'];
  private dbOpenPromise: Promise<IDBDatabase> | null = null;
  private openAttempts = 0;
  private readonly MAX_OPEN_ATTEMPTS = 3;

  private constructor(options: IndexedDBOptions) {
    this.dbName = options.dbName;
    this.dbVersion = options.version;
    this.stores = options.stores;
  }

  static getInstance(options?: IndexedDBOptions): IndexedDBService {
    if (!this.instance) {
      if (!options) {
        throw new Error('IndexedDBService must be initialized with options first');
      }
      this.instance = new IndexedDBService(options);
    }
    return this.instance;
  }

  private async openDatabase(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    
    if (this.dbOpenPromise) return this.dbOpenPromise;
    
    this.openAttempts++;
    
    this.dbOpenPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create stores defined in options
        for (const store of this.stores) {
          // Check if object store already exists
          if (!db.objectStoreNames.contains(store.name)) {
            const objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath });
            
            // Create indices
            if (store.indices) {
              for (const index of store.indices) {
                objectStore.createIndex(index.name, index.keyPath, { unique: index.unique });
              }
            }
          }
        }
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.openAttempts = 0;
        
        // Handle connection drops
        this.db.onclose = () => {
          console.log('IndexedDB connection closed unexpectedly');
          this.db = null;
        };
        
        // Handle version change (another tab changed the version)
        this.db.onversionchange = () => {
          this.db?.close();
          this.db = null;
          console.log('Database version changed, closing connection');
        };
        
        resolve(this.db);
        this.dbOpenPromise = null;
      };
      
      request.onerror = (event) => {
        console.error('Error opening IndexedDB:', event);
        this.dbOpenPromise = null;
        
        if (this.openAttempts < this.MAX_OPEN_ATTEMPTS) {
          console.log(`Retrying IndexedDB open (attempt ${this.openAttempts})`);
          setTimeout(() => {
            this.openDatabase().then(resolve).catch(reject);
          }, 100 * this.openAttempts);
        } else {
          reject(new Error('Failed to open IndexedDB after multiple attempts'));
        }
      };
    });
    
    return this.dbOpenPromise;
  }

  async add<T>(storeName: string, item: T): Promise<IDBValidKey> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.add(item);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async put<T>(storeName: string, item: T): Promise<IDBValidKey> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.put(item);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async get<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      
      const request = store.get(key);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async getAll<T>(
    storeName: string, 
    options: QueryOptions = {}
  ): Promise<T[]> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      
      let objectStore: IDBObjectStore | IDBIndex = store;
      if (options.index) {
        objectStore = store.index(options.index);
      }
      
      // Use cursor for more control over results when options are specified
      if (options.limit || options.offset || options.order) {
        const results: T[] = [];
        let cursorRequest: IDBRequest<IDBCursorWithValue | null>;
        
        // Open cursor in appropriate direction
        if (options.order === 'desc') {
          cursorRequest = objectStore.openCursor(null, 'prev');
        } else {
          cursorRequest = objectStore.openCursor();
        }
        
        let skipped = 0;
        const offset = options.offset || 0;
        const limit = options.limit || Infinity;
        
        cursorRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          
          if (cursor) {
            // Skip records for offset
            if (skipped < offset) {
              skipped++;
              cursor.continue();
              return;
            }
            
            // Add record to results if we're within limit
            if (results.length < limit) {
              results.push(cursor.value);
              cursor.continue();
            } else {
              // We've reached the limit
              resolve(results);
            }
          } else {
            // No more records
            resolve(results);
          }
        };
        
        cursorRequest.onerror = () => {
          reject(cursorRequest.error);
        };
      } else {
        // If no options, use simpler getAll
        const request = objectStore.getAll();
        
        request.onsuccess = () => {
          resolve(request.result);
        };
        
        request.onerror = () => {
          reject(request.error);
        };
      }
    });
  }

  async getByIndex<T>(storeName: string, indexName: string, key: IDBValidKey): Promise<T[]> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      
      const request = index.getAll(key);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.delete(key);
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.clear();
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async count(storeName: string, indexName?: string, key?: IDBValidKey): Promise<number> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      
      let countRequest: IDBRequest<number>;
      
      if (indexName && key !== undefined) {
        const index = store.index(indexName);
        countRequest = index.count(key);
      } else if (indexName) {
        const index = store.index(indexName);
        countRequest = index.count();
      } else {
        countRequest = store.count();
      }
      
      countRequest.onsuccess = () => {
        resolve(countRequest.result);
      };
      
      countRequest.onerror = () => {
        reject(countRequest.error);
      };
    });
  }

  // Method to handle bulk operations with chunking
  async bulkPut<T>(storeName: string, items: T[], chunkSize = 100): Promise<void> {
    if (!items.length) return;
    
    // Process in chunks to avoid transaction timeouts
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const db = await this.openDatabase();
      
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        transaction.oncomplete = () => {
          resolve();
        };
        
        transaction.onerror = () => {
          reject(transaction.error);
        };
        
        transaction.onabort = () => {
          reject(new Error('Transaction was aborted'));
        };
        
        chunk.forEach(item => {
          store.put(item);
        });
      });
    }
  }

  // Support for cursor-based operations (useful for large datasets)
  async processByCursor<T>(
    storeName: string, 
    callback: (item: T) => Promise<T | null> | T | null,
    options?: { 
      batchSize?: number;
      onProgress?: (processed: number, total: number) => void;
      index?: string;
      direction?: IDBCursorDirection;
    }
  ): Promise<void> {
    const db = await this.openDatabase();
    const batchSize = options?.batchSize || 50;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      let objectStore: IDBObjectStore | IDBIndex = store;
      if (options?.index) {
        objectStore = store.index(options.index);
      }
      
      // Get total count for progress reporting
      const countRequest = objectStore.count();
      let total = 0;
      let processed = 0;
      
      countRequest.onsuccess = () => {
        total = countRequest.result;
        
        // Open cursor in specified direction
        const openCursorRequest = objectStore.openCursor(
          null, 
          options?.direction || 'next'
        );
        
        let batch: T[] = [];
        
        openCursorRequest.onsuccess = async (event) => {
          const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
          
          if (cursor) {
            try {
              const result = await callback(cursor.value);
              if (result !== null) {
                batch.push(result);
              }
              
              processed++;
              
              if (batch.length >= batchSize) {
                // Process batch
                for (const item of batch) {
                  cursor.update(item);
                }
                batch = [];
                
                if (options?.onProgress) {
                  options.onProgress(processed, total);
                }
              }
              
              cursor.continue();
            } catch (error) {
              reject(error);
            }
          } else {
            // Process remaining batch
            for (const item of batch) {
              try {
                await store.put(item);
              } catch (error) {
                reject(error);
              }
            }
            
            if (options?.onProgress) {
              options.onProgress(processed, total);
            }
            
            resolve();
          }
        };
        
        openCursorRequest.onerror = () => {
          reject(openCursorRequest.error);
        };
      };
      
      countRequest.onerror = () => {
        reject(countRequest.error);
      };
      
      transaction.onerror = () => {
        reject(transaction.error);
      };
    });
  }
  
  // Get database size estimate (helpful for monitoring storage usage)
  async getDatabaseSize(): Promise<number> {
    if (!navigator.storage || !navigator.storage.estimate) {
      return 0;
    }
    
    try {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    } catch (error) {
      console.error('Error estimating database size:', error);
      return 0;
    }
  }
  
  // Get list of all object store names in the database
  async getStoreNames(): Promise<string[]> {
    const db = await this.openDatabase();
    return Array.from(db.objectStoreNames);
  }
  
  // Close the database connection explicitly
  closeDatabase(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('Database connection closed explicitly');
    }
  }
}

// Initialize the bookmark database service with expanded stores
const bookmarkDbService = IndexedDBService.getInstance({
  dbName: 'bookmark-manager-db',
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
        { name: 'parentId', keyPath: 'parentId', unique: false },
        { name: 'syncStatus', keyPath: 'metadata.syncStatus', unique: false }
      ]
    },
    {
      name: 'bookmark_indices',
      keyPath: 'id',
      indices: [
        { name: 'title', keyPath: 'title', unique: false },
        { name: 'url', keyPath: 'url', unique: false },
        { name: 'category', keyPath: 'category', unique: false },
        { name: 'dateAdded', keyPath: 'dateAdded', unique: false },
        { name: 'parentId', keyPath: 'parentId', unique: false }
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
      name: 'sync_queue',
      keyPath: 'id',
      indices: [
        { name: 'type', keyPath: 'type', unique: false },
        { name: 'timestamp', keyPath: 'timestamp', unique: false },
        { name: 'status', keyPath: 'status', unique: false }
      ]
    },
    {
      name: 'bookmark_metadata',
      keyPath: 'id',
      indices: [
        { name: 'bookmarkId', keyPath: 'bookmarkId', unique: false },
        { name: 'timestamp', keyPath: 'timestamp', unique: false }
      ]
    }
  ]
});

export { bookmarkDbService };

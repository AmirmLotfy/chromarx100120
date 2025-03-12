
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

export class IndexedDBService {
  private static instance: IndexedDBService;
  private db: IDBDatabase | null = null;
  private dbName: string;
  private dbVersion: number;
  private stores: IndexedDBOptions['stores'];
  private dbOpenPromise: Promise<IDBDatabase> | null = null;

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
        resolve(this.db);
        this.dbOpenPromise = null;
      };
      
      request.onerror = (event) => {
        console.error('Error opening IndexedDB:', event);
        reject(new Error('Failed to open IndexedDB'));
        this.dbOpenPromise = null;
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

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
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

  async count(storeName: string): Promise<number> {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      
      const request = store.count();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
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
        
        let completed = 0;
        
        transaction.oncomplete = () => {
          resolve();
        };
        
        transaction.onerror = () => {
          reject(transaction.error);
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
    }
  ): Promise<void> {
    const db = await this.openDatabase();
    const batchSize = options?.batchSize || 50;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Get total count for progress reporting
      const countRequest = store.count();
      let total = 0;
      let processed = 0;
      
      countRequest.onsuccess = () => {
        total = countRequest.result;
        const openCursorRequest = store.openCursor();
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
}

// Initialize the bookmark database service
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
      name: 'syncQueue',
      keyPath: 'id',
      indices: [
        { name: 'type', keyPath: 'type', unique: false },
        { name: 'timestamp', keyPath: 'timestamp', unique: false }
      ]
    }
  ]
});

export { bookmarkDbService };

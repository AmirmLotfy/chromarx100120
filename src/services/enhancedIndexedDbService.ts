
/**
 * Enhanced IndexedDB Service
 * Provides a more efficient way to interact with IndexedDB using the Streams API
 */

import { processWithStreams, processInBatches } from "@/utils/webStreamUtils";
import { toast } from "sonner";

interface IndexedDbOptions {
  name: string;
  version: number;
  stores: {
    name: string;
    keyPath: string;
    indices?: Array<{
      name: string;
      keyPath: string | string[];
      options?: IDBIndexParameters;
    }>;
  }[];
}

interface QueryOptions {
  index?: string;
  range?: IDBKeyRange;
  direction?: IDBCursorDirection;
  limit?: number;
  offset?: number;
}

export class EnhancedIndexedDbService {
  private db: IDBDatabase | null = null;
  private options: IndexedDbOptions;
  private isInitializing: boolean = false;
  private initPromise: Promise<IDBDatabase> | null = null;

  constructor(options: IndexedDbOptions) {
    this.options = options;
  }

  /**
   * Opens the IndexedDB database and creates the necessary object stores
   */
  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    
    if (this.initPromise) return this.initPromise;
    
    this.isInitializing = true;
    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.options.name, this.options.version);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBRequest<IDBDatabase>).result;
        
        // Create or update object stores
        for (const store of this.options.stores) {
          let objectStore: IDBObjectStore;
          
          // Create store if it doesn't exist
          if (!db.objectStoreNames.contains(store.name)) {
            objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath });
            console.log(`Created store: ${store.name}`);
          } else {
            objectStore = request.transaction!.objectStore(store.name);
          }
          
          // Create or update indices
          if (store.indices) {
            const existingIndices = Array.from({ length: objectStore.indexNames.length })
              .map((_, i) => objectStore.indexNames[i]);
              
            for (const indexDef of store.indices) {
              if (!existingIndices.includes(indexDef.name)) {
                objectStore.createIndex(indexDef.name, indexDef.keyPath, indexDef.options);
                console.log(`Created index: ${indexDef.name} on ${store.name}`);
              }
            }
          }
        }
      };
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBRequest<IDBDatabase>).result;
        this.isInitializing = false;
        console.log(`Successfully opened database: ${this.options.name}`);
        resolve(this.db);
      };
      
      request.onerror = (event) => {
        this.isInitializing = false;
        this.initPromise = null;
        console.error("Error opening database:", request.error);
        reject(request.error);
      };
    });
    
    return this.initPromise;
  }
  
  /**
   * Ensures the database is open before performing operations
   */
  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db && !this.isInitializing) {
      return this.open();
    } else if (this.isInitializing) {
      return this.initPromise!;
    }
    return this.db!;
  }
  
  /**
   * Creates a transaction for the specified store(s)
   */
  private createTransaction(
    storeNames: string | string[],
    mode: IDBTransactionMode = "readonly"
  ): IDBTransaction {
    if (!this.db) {
      throw new Error("Database is not open");
    }
    
    return this.db.transaction(storeNames, mode);
  }
  
  /**
   * Gets an object store from a transaction
   */
  private getObjectStore(
    transaction: IDBTransaction,
    storeName: string
  ): IDBObjectStore {
    return transaction.objectStore(storeName);
  }

  /**
   * Adds a record to the specified store
   */
  async add<T>(storeName: string, record: T): Promise<IDBValidKey> {
    await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = this.createTransaction(storeName, "readwrite");
      const store = this.getObjectStore(transaction, storeName);
      
      const request = store.add(record);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Adds multiple records to the specified store using streams for efficiency
   */
  async addBulk<T>(storeName: string, records: T[]): Promise<void> {
    if (records.length === 0) return;
    
    await this.ensureDb();
    
    // Use batch processing for larger datasets
    if (records.length > 1000) {
      await processInBatches(
        records,
        async (batch) => {
          const transaction = this.createTransaction(storeName, "readwrite");
          const store = this.getObjectStore(transaction, storeName);
          
          return new Promise((resolve, reject) => {
            for (const record of batch) {
              store.add(record);
            }
            
            transaction.oncomplete = () => resolve([]);
            transaction.onerror = () => reject(transaction.error);
          });
        },
        {
          batchSize: 500,
          onProgress: (processed, total, percentage) => {
            if (percentage % 10 === 0) {
              console.log(`Adding records: ${percentage}% complete`);
            }
          }
        }
      );
    } else {
      // For smaller datasets, use a single transaction
      const transaction = this.createTransaction(storeName, "readwrite");
      const store = this.getObjectStore(transaction, storeName);
      
      return new Promise((resolve, reject) => {
        for (const record of records) {
          store.add(record);
        }
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    }
  }

  /**
   * Gets a record by its key
   */
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = this.createTransaction(storeName);
      const store = this.getObjectStore(transaction, storeName);
      
      const request = store.get(key);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Gets all records from a store with optional query parameters
   * Uses streams for efficient processing of large result sets
   */
  async getAll<T>(
    storeName: string,
    options: QueryOptions = {}
  ): Promise<T[]> {
    await this.ensureDb();
    
    const { index, range, direction, limit, offset = 0 } = options;
    
    return new Promise((resolve, reject) => {
      const transaction = this.createTransaction(storeName);
      const store = this.getObjectStore(transaction, storeName);
      
      // Use the specified index or the object store directly
      const source = index ? store.index(index) : store;
      
      const results: T[] = [];
      
      // Use a cursor for more control over the results
      const request = source.openCursor(range, direction);
      let skip = offset;
      let count = 0;
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
        
        if (cursor) {
          if (skip > 0) {
            skip--;
            cursor.continue();
          } else if (limit === undefined || count < limit) {
            results.push(cursor.value);
            count++;
            cursor.continue();
          } else {
            // Reached the limit
            resolve(results);
          }
        } else {
          // No more records
          resolve(results);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Gets all records from a store and processes them using streams
   */
  async getAllAsStream<T, R>(
    storeName: string,
    processFn: (item: T) => Promise<R> | R,
    options: QueryOptions & {
      onProgress?: (processed: number, total: number, percentage: number) => void;
      onComplete?: (results: R[]) => void;
      signal?: AbortSignal;
    } = {}
  ): Promise<R[]> {
    const items = await this.getAll<T>(storeName, options);
    
    if (items.length === 0) return [];
    
    const { onProgress, onComplete, signal } = options;
    
    return processWithStreams(items, processFn, {
      onProgress,
      onComplete,
      signal
    });
  }

  /**
   * Puts (updates or inserts) a record
   */
  async put<T>(storeName: string, record: T): Promise<IDBValidKey> {
    await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = this.createTransaction(storeName, "readwrite");
      const store = this.getObjectStore(transaction, storeName);
      
      const request = store.put(record);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Puts multiple records using streams
   */
  async putBulk<T>(storeName: string, records: T[]): Promise<void> {
    if (records.length === 0) return;
    
    await this.ensureDb();
    
    // Use batch processing for larger datasets
    if (records.length > 1000) {
      await processInBatches(
        records,
        async (batch) => {
          const transaction = this.createTransaction(storeName, "readwrite");
          const store = this.getObjectStore(transaction, storeName);
          
          return new Promise((resolve, reject) => {
            for (const record of batch) {
              store.put(record);
            }
            
            transaction.oncomplete = () => resolve([]);
            transaction.onerror = () => reject(transaction.error);
          });
        },
        {
          batchSize: 500,
          onProgress: (processed, total, percentage) => {
            if (percentage % 10 === 0) {
              console.log(`Updating records: ${percentage}% complete`);
            }
          }
        }
      );
    } else {
      // For smaller datasets, use a single transaction
      const transaction = this.createTransaction(storeName, "readwrite");
      const store = this.getObjectStore(transaction, storeName);
      
      return new Promise((resolve, reject) => {
        for (const record of records) {
          store.put(record);
        }
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    }
  }

  /**
   * Deletes a record by its key
   */
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = this.createTransaction(storeName, "readwrite");
      const store = this.getObjectStore(transaction, storeName);
      
      const request = store.delete(key);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Deletes multiple records using streams
   */
  async deleteBulk(storeName: string, keys: IDBValidKey[]): Promise<void> {
    if (keys.length === 0) return;
    
    await this.ensureDb();
    
    // Use batch processing for larger datasets
    if (keys.length > 1000) {
      await processInBatches(
        keys,
        async (batch) => {
          const transaction = this.createTransaction(storeName, "readwrite");
          const store = this.getObjectStore(transaction, storeName);
          
          return new Promise((resolve, reject) => {
            for (const key of batch) {
              store.delete(key);
            }
            
            transaction.oncomplete = () => resolve([]);
            transaction.onerror = () => reject(transaction.error);
          });
        },
        {
          batchSize: 500,
          onProgress: (processed, total, percentage) => {
            if (percentage % 10 === 0) {
              console.log(`Deleting records: ${percentage}% complete`);
            }
          }
        }
      );
    } else {
      // For smaller datasets, use a single transaction
      const transaction = this.createTransaction(storeName, "readwrite");
      const store = this.getObjectStore(transaction, storeName);
      
      return new Promise((resolve, reject) => {
        for (const key of keys) {
          store.delete(key);
        }
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    }
  }

  /**
   * Counts the number of records in a store
   */
  async count(storeName: string, key?: IDBValidKey | IDBKeyRange): Promise<number> {
    await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = this.createTransaction(storeName);
      const store = this.getObjectStore(transaction, storeName);
      
      const request = key ? store.count(key) : store.count();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clears all records from a store
   */
  async clear(storeName: string): Promise<void> {
    await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = this.createTransaction(storeName, "readwrite");
      const store = this.getObjectStore(transaction, storeName);
      
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Performs a transaction with callback
   */
  async transaction<T>(
    storeNames: string | string[],
    mode: IDBTransactionMode,
    callback: (transaction: IDBTransaction) => Promise<T>
  ): Promise<T> {
    await this.ensureDb();
    
    return new Promise((resolve, reject) => {
      const transaction = this.createTransaction(storeNames, mode);
      
      transaction.oncomplete = () => {
        resolve(result);
      };
      
      transaction.onerror = () => {
        reject(transaction.error);
      };
      
      let result: T;
      callback(transaction)
        .then(value => {
          result = value;
        })
        .catch(error => {
          transaction.abort();
          reject(error);
        });
    });
  }

  /**
   * Closes the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Deletes the database
   */
  static async deleteDatabase(name: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(name);
      
      request.onsuccess = () => {
        console.log(`Database ${name} deleted successfully`);
        resolve();
      };
      
      request.onerror = () => {
        console.error(`Error deleting database ${name}:`, request.error);
        reject(request.error);
      };
    });
  }
}

// Create and export the default instance
export const enhancedIndexedDb = new EnhancedIndexedDbService({
  name: "bookmark_extension_db",
  version: 1,
  stores: [
    {
      name: "bookmarks",
      keyPath: "id",
      indices: [
        { name: "url", keyPath: "url" },
        { name: "title", keyPath: "title" },
        { name: "dateAdded", keyPath: "dateAdded" },
        { name: "category", keyPath: "category" },
        { name: "tags", keyPath: "tags", options: { multiEntry: true } }
      ]
    },
    {
      name: "bookmark_indices",
      keyPath: "id",
      indices: [
        { name: "title", keyPath: "title" },
        { name: "url", keyPath: "url" },
        { name: "dateAdded", keyPath: "dateAdded" },
        { name: "category", keyPath: "category" },
        { name: "tags", keyPath: "tags", options: { multiEntry: true } }
      ]
    },
    {
      name: "categories",
      keyPath: "id",
      indices: [
        { name: "name", keyPath: "name" }
      ]
    },
    {
      name: "sync_queue",
      keyPath: "id",
      indices: [
        { name: "timestamp", keyPath: "timestamp" },
        { name: "status", keyPath: "status" }
      ]
    },
    {
      name: "bookmark_metadata",
      keyPath: "id"
    }
  ]
});

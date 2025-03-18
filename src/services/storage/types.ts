
/**
 * Core storage interfaces for the unified storage system
 */

export type StorageArea = 'sync' | 'local' | 'managed' | 'session';

export interface StorageOptions {
  /**
   * Storage area to use (for Chrome storage)
   */
  area?: StorageArea;
  
  /**
   * Whether to encrypt sensitive data
   */
  encrypt?: boolean;
  
  /**
   * Time-to-live in minutes (for cached data)
   */
  ttl?: number;
  
  /**
   * Whether to use IndexedDB for this data (for larger objects)
   */
  useIndexedDb?: boolean;
  
  /**
   * Whether to cache in memory for faster access
   */
  cacheInMemory?: boolean;
}

export interface StorageItem<T> {
  value: T;
  expiry: number | null;
  timestamp: number;
  version?: number;
}

export interface IStorageProvider {
  get<T>(key: string, options?: StorageOptions): Promise<T | null>;
  set<T>(key: string, value: T, options?: StorageOptions): Promise<boolean>;
  update<T extends object>(key: string, partialValue: Partial<T>, options?: StorageOptions): Promise<boolean>;
  remove(key: string, options?: StorageOptions): Promise<boolean>;
  clear(options?: StorageOptions): Promise<boolean>;
  listKeys(options?: StorageOptions): Promise<string[]>;
}

export interface DatabaseOptions {
  storeName: string;
  useIndices?: string[];
  version?: number;
}

export interface IStorageDatabase {
  get<T>(id: string, options?: DatabaseOptions): Promise<T | null>;
  getAll<T>(options?: DatabaseOptions): Promise<T[]>;
  query<T>(queryFn: (item: T) => boolean, options?: DatabaseOptions): Promise<T[]>;
  add<T>(data: T, options?: DatabaseOptions): Promise<string | number>;
  update<T>(id: string, data: Partial<T>, options?: DatabaseOptions): Promise<boolean>;
  delete(id: string, options?: DatabaseOptions): Promise<boolean>;
  clear(options?: DatabaseOptions): Promise<boolean>;
}

export interface IUnifiedStorage {
  storage: IStorageProvider;
  db: IStorageDatabase;
  cache: ICacheManager;
}

export interface ICacheManager {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMinutes?: number): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  primeCache<T>(key: string, fetchDataFn: () => Promise<T>, ttlMinutes?: number): Promise<T>;
}

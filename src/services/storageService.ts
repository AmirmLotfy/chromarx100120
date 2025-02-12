
import { chromeDb } from '@/lib/chrome-storage';
import { retryWithBackoff } from '@/utils/retryUtils';
import { toast } from 'sonner';

export class StorageService {
  private static instance: StorageService;
  private cache = new Map<string, any>();

  private constructor() {}

  static getInstance(): StorageService {
    if (!this.instance) {
      this.instance = new StorageService();
    }
    return this.instance;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.cache.has(key)) {
        return this.cache.get(key);
      }

      const value = await retryWithBackoff(() => chromeDb.get<T>(key));
      if (value !== null) {
        this.cache.set(key, value);
      }
      return value;
    } catch (error) {
      console.error(`Error reading ${key} from storage:`, error);
      toast.error(`Failed to read ${key} from storage`);
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await retryWithBackoff(() => chromeDb.set(key, value));
      this.cache.set(key, value);
    } catch (error) {
      console.error(`Error writing ${key} to storage:`, error);
      toast.error(`Failed to write ${key} to storage`);
      throw error;
    }
  }

  async update<T>(key: string, value: Partial<T>): Promise<void> {
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
      await retryWithBackoff(() => chromeDb.remove(key));
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

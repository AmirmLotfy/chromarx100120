
import { chromeStorage } from '@/services/chromeStorageService';
import { v4 as uuidv4 } from 'uuid';

// Types to mimic Supabase types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

interface FromOptions {
  count?: 'exact' | 'planned' | 'estimated';
  head?: boolean;
}

interface QueryResult<T> {
  data: T[] | null;
  error: Error | null;
  count: number | null;
  status: number;
  statusText: string;
}

interface SingleQueryResult<T> {
  data: T | null;
  error: Error | null;
  status: number;
  statusText: string;
}

interface ExecuteResult {
  error: Error | null;
}

class QueryBuilder<T> {
  private collection: string;
  private filters: Array<(item: any) => boolean> = [];
  private sortField: string | null = null;
  private sortDirection: 'asc' | 'desc' = 'asc';
  private limitCount: number | null = null;
  private client: ChromeStorageClient;

  constructor(collection: string, client: ChromeStorageClient) {
    this.collection = collection;
    this.client = client;
  }

  // Filter methods
  eq(field: string, value: any): QueryBuilder<T> {
    this.filters.push((item) => item[field] === value);
    return this;
  }

  neq(field: string, value: any): QueryBuilder<T> {
    this.filters.push((item) => item[field] !== value);
    return this;
  }

  gt(field: string, value: any): QueryBuilder<T> {
    this.filters.push((item) => item[field] > value);
    return this;
  }

  gte(field: string, value: any): QueryBuilder<T> {
    this.filters.push((item) => item[field] >= value);
    return this;
  }

  lt(field: string, value: any): QueryBuilder<T> {
    this.filters.push((item) => item[field] < value);
    return this;
  }

  lte(field: string, value: any): QueryBuilder<T> {
    this.filters.push((item) => item[field] <= value);
    return this;
  }

  // Order method
  order(field: string, { ascending }: { ascending: boolean } = { ascending: true }): QueryBuilder<T> {
    this.sortField = field;
    this.sortDirection = ascending ? 'asc' : 'desc';
    return this;
  }

  // Limit method
  limit(count: number): QueryBuilder<T> {
    this.limitCount = count;
    return this;
  }

  // Execute methods
  async select(options?: FromOptions): Promise<QueryResult<T>> {
    try {
      // Get data from collection
      let data = await chromeStorage.get<T[]>(this.collection) || [];
      
      // Apply filters
      if (this.filters.length > 0) {
        data = data.filter(item => this.filters.every(filter => filter(item)));
      }
      
      // Apply sorting
      if (this.sortField) {
        data.sort((a: any, b: any) => {
          const aValue = a[this.sortField as string];
          const bValue = b[this.sortField as string];
          
          if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
          if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
          return 0;
        });
      }
      
      // Apply limit
      if (this.limitCount !== null && data.length > this.limitCount) {
        data = data.slice(0, this.limitCount);
      }
      
      // Return count only if head is true
      if (options?.head) {
        return {
          data: [],
          error: null,
          count: data.length,
          status: 200,
          statusText: 'OK'
        };
      }
      
      return {
        data,
        error: null,
        count: options?.count ? data.length : null,
        status: 200,
        statusText: 'OK'
      };
    } catch (error) {
      console.error(`Error executing select on ${this.collection}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
        count: null,
        status: 500,
        statusText: 'Internal Error'
      };
    }
  }

  async execute(): Promise<ExecuteResult> {
    try {
      await this.select();
      return { error: null };
    } catch (error) {
      console.error(`Error executing operation on ${this.collection}:`, error);
      return { 
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  async maybeSingle(): Promise<SingleQueryResult<T>> {
    try {
      const result = await this.select();
      
      if (result.error) {
        throw result.error;
      }
      
      const data = result.data;
      
      if (!data || data.length === 0) {
        return {
          data: null,
          error: null,
          status: 200,
          statusText: 'OK'
        };
      }
      
      return {
        data: data[0],
        error: null,
        status: 200,
        statusText: 'OK'
      };
    } catch (error) {
      console.error(`Error executing maybeSingle on ${this.collection}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
        status: 500,
        statusText: 'Internal Error'
      };
    }
  }

  async single(): Promise<SingleQueryResult<T>> {
    try {
      const result = await this.select();
      
      if (result.error) {
        throw result.error;
      }
      
      const data = result.data;
      
      if (!data || data.length === 0) {
        throw new Error('No rows found');
      }
      
      if (data.length > 1) {
        throw new Error('More than one row found');
      }
      
      return {
        data: data[0],
        error: null,
        status: 200,
        statusText: 'OK'
      };
    } catch (error) {
      console.error(`Error executing single on ${this.collection}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
        status: 500,
        statusText: 'Internal Error'
      };
    }
  }

  // Insert method
  async insert(data: Partial<T> | Partial<T>[]): Promise<QueryResult<T>> {
    try {
      const items = Array.isArray(data) ? data : [data];
      const timestamp = new Date().toISOString();
      
      // Get existing data
      const existingData = await chromeStorage.get<T[]>(this.collection) || [];
      
      // Prepare items to insert with IDs and timestamps
      const itemsToInsert = items.map(item => ({
        ...item,
        id: (item as any).id || uuidv4(),
        created_at: timestamp,
        updated_at: timestamp
      })) as T[];
      
      // Add new items to collection
      const updatedData = [...existingData, ...itemsToInsert];
      
      // Save to storage
      await chromeStorage.set(this.collection, updatedData);
      
      return {
        data: itemsToInsert,
        error: null,
        count: itemsToInsert.length,
        status: 201,
        statusText: 'Created'
      };
    } catch (error) {
      console.error(`Error executing insert on ${this.collection}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
        count: null,
        status: 500,
        statusText: 'Internal Error'
      };
    }
  }

  // Update method
  async update(data: Partial<T>): Promise<QueryResult<T>> {
    try {
      // Get existing data
      let existingData = await chromeStorage.get<T[]>(this.collection) || [];
      
      // Find items to update based on filters
      if (this.filters.length === 0) {
        throw new Error('Update operation requires at least one filter');
      }
      
      // Apply filters
      const itemsToUpdate = existingData.filter(item => this.filters.every(filter => filter(item)));
      
      if (itemsToUpdate.length === 0) {
        return {
          data: [],
          error: null,
          count: 0,
          status: 200,
          statusText: 'No items matched the filters'
        };
      }
      
      // Update items
      const timestamp = new Date().toISOString();
      const updatedItems: T[] = [];
      
      existingData = existingData.map(item => {
        if (this.filters.every(filter => filter(item))) {
          const updatedItem = {
            ...item,
            ...data,
            updated_at: timestamp
          } as T;
          
          updatedItems.push(updatedItem);
          return updatedItem;
        }
        return item;
      });
      
      // Save to storage
      await chromeStorage.set(this.collection, existingData);
      
      return {
        data: updatedItems,
        error: null,
        count: updatedItems.length,
        status: 200,
        statusText: 'OK'
      };
    } catch (error) {
      console.error(`Error executing update on ${this.collection}:`, error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
        count: null,
        status: 500,
        statusText: 'Internal Error'
      };
    }
  }

  // Delete method
  async delete(): Promise<ExecuteResult> {
    try {
      // Get existing data
      const existingData = await chromeStorage.get<T[]>(this.collection) || [];
      
      // Find items to delete based on filters
      if (this.filters.length === 0) {
        throw new Error('Delete operation requires at least one filter');
      }
      
      // Filter out items to delete
      const updatedData = existingData.filter(item => !this.filters.every(filter => filter(item)));
      
      // Save to storage
      await chromeStorage.set(this.collection, updatedData);
      
      return { error: null };
    } catch (error) {
      console.error(`Error executing delete on ${this.collection}:`, error);
      return { 
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
}

class AuthAPI {
  async getUser() {
    // Simplified auth that uses chrome storage
    const userData = await chromeStorage.get('user_data');
    return {
      data: {
        user: userData
      },
      error: null
    };
  }

  async signOut() {
    try {
      await chromeStorage.remove('user_data');
      return { error: null };
    } catch (error) {
      return { error };
    }
  }
}

class ChromeStorageClient {
  auth: AuthAPI;

  constructor() {
    this.auth = new AuthAPI();
  }

  from<T = any>(collection: string): QueryBuilder<T> {
    return new QueryBuilder<T>(collection, this);
  }
}

// Create a singleton instance
export const localStorageClient = new ChromeStorageClient();

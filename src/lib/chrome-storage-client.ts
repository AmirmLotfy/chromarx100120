
import { chromeStorage } from '@/services/chromeStorageService';
import { Json } from '@/lib/json-types';

// Interface for query result
interface QueryResult<T> {
  data: T[] | null;
  error: Error | null;
}

// Interface for the builder pattern for building queries
interface QueryBuilder<T> {
  select(): QueryBuilder<T>;
  eq(column: string, value: any): QueryBuilder<T>;
  order(column: string, options?: { ascending: boolean }): QueryBuilder<T>;
  delete(): QueryBuilder<T>;
  insert(data: T | T[]): QueryBuilder<T>;
  update(data: Partial<T>): QueryBuilder<T>;
  upsert(data: T | T[]): QueryBuilder<T>;
  from: (table: string) => QueryBuilder<T>;
  execute(): Promise<QueryResult<T>>;
  single(): Promise<{ data: T | null; error: Error | null }>;
}

// Add mock auth interface
interface AuthInterface {
  getUser(): Promise<{ data: { user: { id: string } | null } }>;
}

// Implements a Supabase-like client for Chrome storage
class ChromeStorageClient {
  private tableName: string = '';
  private filters: Array<{ column: string; value: any }> = [];
  private orderByColumn: string | null = null;
  private ascending: boolean = true;
  private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private dataToInsert: any = null;
  private dataToUpdate: any = null;

  // Mock auth
  auth: AuthInterface = {
    getUser: async () => ({ data: { user: { id: 'current-user' } } })
  };

  // Mock channels
  channel(name: string) {
    return {
      on: (event: string, callback: Function) => this,
      subscribe: () => Promise.resolve(this)
    };
  }

  removeChannel(name: string) {
    // Mock method
    return;
  }

  async get<T>(key: string): Promise<T | null> {
    return await chromeStorage.get<T>(key);
  }

  async set<T>(key: string, value: T): Promise<boolean> {
    return await chromeStorage.set(key, value);
  }

  async remove(key: string): Promise<boolean> {
    return await chromeStorage.remove(key);
  }

  from<T>(tableName: string): QueryBuilder<T> {
    this.tableName = tableName;
    this.filters = [];
    this.orderByColumn = null;
    this.ascending = true;
    this.operation = 'select';
    this.dataToInsert = null;
    this.dataToUpdate = null;
    
    return this.createQueryBuilder<T>();
  }

  private createQueryBuilder<T>(): QueryBuilder<T> {
    return {
      select: (): QueryBuilder<T> => {
        this.operation = 'select';
        return this.createQueryBuilder<T>();
      },
      
      eq: (column: string, value: any): QueryBuilder<T> => {
        this.filters.push({ column, value });
        return this.createQueryBuilder<T>();
      },
      
      order: (column: string, options?: { ascending: boolean }): QueryBuilder<T> => {
        this.orderByColumn = column;
        this.ascending = options?.ascending ?? true;
        return this.createQueryBuilder<T>();
      },
      
      delete: (): QueryBuilder<T> => {
        this.operation = 'delete';
        return this.createQueryBuilder<T>();
      },
      
      insert: (data: T | T[]): QueryBuilder<T> => {
        this.operation = 'insert';
        this.dataToInsert = data;
        return this.createQueryBuilder<T>();
      },
      
      update: (data: Partial<T>): QueryBuilder<T> => {
        this.operation = 'update';
        this.dataToUpdate = data;
        return this.createQueryBuilder<T>();
      },
      
      upsert: (data: T | T[]): QueryBuilder<T> => {
        this.operation = 'upsert';
        this.dataToInsert = data;
        return this.createQueryBuilder<T>();
      },
      
      from: this.from.bind(this),
      
      execute: async (): Promise<QueryResult<T>> => {
        try {
          switch (this.operation) {
            case 'select':
              return await this.executeSelect<T>();
            case 'delete':
              return await this.executeDelete<T>();
            case 'insert':
              return await this.executeInsert<T>();
            case 'update':
              return await this.executeUpdate<T>();
            case 'upsert':
              return await this.executeUpsert<T>();
            default:
              return { data: null, error: new Error('Invalid operation') };
          }
        } catch (error) {
          console.error(`Error executing ${this.operation} on ${this.tableName}:`, error);
          return { 
            data: null, 
            error: error instanceof Error ? error : new Error('Unknown error') 
          };
        }
      },
      
      single: async (): Promise<{ data: T | null; error: Error | null }> => {
        try {
          const result = await this.execute();
          if (result.error) throw result.error;
          
          const data = result.data && result.data.length > 0 ? result.data[0] : null;
          return { data, error: null };
        } catch (error) {
          console.error(`Error executing single ${this.operation} on ${this.tableName}:`, error);
          return { 
            data: null, 
            error: error instanceof Error ? error : new Error('Unknown error') 
          };
        }
      }
    };
  }

  private async executeSelect<T>(): Promise<QueryResult<T>> {
    try {
      // Get all data for the table
      const tableData = await this.getTable<T>();
      
      // Apply filters
      let filteredData = this.applyFilters(tableData);
      
      // Apply ordering if specified
      if (this.orderByColumn) {
        filteredData = this.applyOrdering(filteredData);
      }
      
      return { data: filteredData, error: null };
    } catch (error) {
      console.error(`Error selecting from ${this.tableName}:`, error);
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  private async executeDelete<T>(): Promise<QueryResult<T>> {
    try {
      // Get all data for the table
      const tableData = await this.getTable<T>();
      
      // Apply filters to find items to delete
      const filteredData = this.applyFilters(tableData);
      
      // Get items to keep
      const itemsToKeep = tableData.filter(item => 
        !filteredData.some(filteredItem => 
          this.compareItems(item, filteredItem)
        )
      );
      
      // Save the updated table
      await chromeStorage.set(`${this.tableName}`, itemsToKeep);
      
      return { data: filteredData, error: null };
    } catch (error) {
      console.error(`Error deleting from ${this.tableName}:`, error);
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  private async executeInsert<T>(): Promise<QueryResult<T>> {
    try {
      // Get existing data for the table
      const tableData = await this.getTable<T>();
      
      // Add new data (single item or array)
      const itemsToAdd = Array.isArray(this.dataToInsert) ? this.dataToInsert : [this.dataToInsert];
      const updatedData = [...tableData, ...itemsToAdd as T[]]; // Fixed spread type issue with explicit casting
      
      // Save the updated table
      await chromeStorage.set(`${this.tableName}`, updatedData);
      
      return { data: itemsToAdd as T[], error: null };
    } catch (error) {
      console.error(`Error inserting into ${this.tableName}:`, error);
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  private async executeUpsert<T>(): Promise<QueryResult<T>> {
    try {
      // Upsert is similar to insert but checks if item exists
      const tableData = await this.getTable<T>();
      const itemsToUpsert = Array.isArray(this.dataToInsert) ? this.dataToInsert : [this.dataToInsert];
      const result: T[] = [];
      
      // Create a new array with updated items
      const updatedData = [...tableData];
      
      for (const item of itemsToUpsert as T[]) {
        const index = tableData.findIndex(existing => 
          this.compareItems(existing, item)
        );
        
        if (index >= 0) {
          // Update existing item
          updatedData[index] = { ...updatedData[index] as object, ...item as object } as T;
          result.push(updatedData[index]);
        } else {
          // Add new item
          updatedData.push(item);
          result.push(item);
        }
      }
      
      // Save the updated table
      await chromeStorage.set(`${this.tableName}`, updatedData);
      
      return { data: result, error: null };
    } catch (error) {
      console.error(`Error upserting into ${this.tableName}:`, error);
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  private async executeUpdate<T>(): Promise<QueryResult<T>> {
    try {
      // Get all data for the table
      const tableData = await this.getTable<T>();
      
      // Apply filters to find items to update
      const itemsToUpdate = this.applyFilters(tableData);
      
      // Update the items
      const updatedItems: T[] = [];
      const newTableData = tableData.map(item => {
        if (itemsToUpdate.some(updateItem => this.compareItems(item, updateItem))) {
          // Use type assertion to avoid spread operator type issues
          const updated = { ...item as object, ...this.dataToUpdate as object } as T;
          updatedItems.push(updated);
          return updated;
        }
        return item;
      });
      
      // Save the updated table
      await chromeStorage.set(`${this.tableName}`, newTableData);
      
      return { data: updatedItems, error: null };
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  private async getTable<T>(): Promise<T[]> {
    const tableData = await chromeStorage.get<T[]>(`${this.tableName}`);
    return tableData || [];
  }

  private applyFilters<T>(data: T[]): T[] {
    return data.filter(item => 
      this.filters.every(filter => 
        (item as any)[filter.column] === filter.value
      )
    );
  }

  private applyOrdering<T>(data: T[]): T[] {
    if (!this.orderByColumn) return data;
    
    return [...data].sort((a, b) => {
      const valueA = (a as any)[this.orderByColumn as string];
      const valueB = (b as any)[this.orderByColumn as string];
      
      if (valueA < valueB) return this.ascending ? -1 : 1;
      if (valueA > valueB) return this.ascending ? 1 : -1;
      return 0;
    });
  }

  private compareItems<T>(item1: T, item2: T): boolean {
    // For simplicity, we'll compare IDs if they exist
    if ('id' in (item1 as any) && 'id' in (item2 as any)) {
      return (item1 as any).id === (item2 as any).id;
    }
    
    // Otherwise, compare the whole object as JSON
    return JSON.stringify(item1) === JSON.stringify(item2);
  }
}

export const localStorageClient = new ChromeStorageClient();
export { Json };

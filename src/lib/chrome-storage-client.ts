
import { chromeStorage } from '@/services/chromeStorageService';

// Interface for query result
interface QueryResult<T> {
  data: T[] | null;
  error: Error | null;
}

// Interface for the builder pattern for building queries
interface QueryBuilder<T> {
  select(): Promise<QueryResult<T>>;
  eq(column: string, value: any): QueryBuilder<T>;
  order(column: string, options?: { ascending: boolean }): QueryBuilder<T>;
  delete(): Promise<QueryResult<T>>;
  insert(data: T | T[]): Promise<QueryResult<T>>;
  update(data: Partial<T>): Promise<QueryResult<T>>;
  from: (table: string) => QueryBuilder<T>;
}

// Implements a Supabase-like client for Chrome storage
class ChromeStorageClient {
  private tableName: string = '';
  private filters: Array<{ column: string; value: any }> = [];
  private orderByColumn: string | null = null;
  private ascending: boolean = true;

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
    
    return this.createQueryBuilder<T>();
  }

  private createQueryBuilder<T>(): QueryBuilder<T> {
    return {
      select: async (): Promise<QueryResult<T>> => {
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
      
      delete: async (): Promise<QueryResult<T>> => {
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
      },
      
      insert: async (data: T | T[]): Promise<QueryResult<T>> => {
        try {
          // Get existing data for the table
          const tableData = await this.getTable<T>();
          
          // Add new data (single item or array)
          const itemsToAdd = Array.isArray(data) ? data : [data];
          const updatedData = [...tableData, ...itemsToAdd];
          
          // Save the updated table
          await chromeStorage.set(`${this.tableName}`, updatedData);
          
          return { data: itemsToAdd, error: null };
        } catch (error) {
          console.error(`Error inserting into ${this.tableName}:`, error);
          return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
        }
      },
      
      update: async (data: Partial<T>): Promise<QueryResult<T>> => {
        try {
          // Get all data for the table
          const tableData = await this.getTable<T>();
          
          // Apply filters to find items to update
          const itemsToUpdate = this.applyFilters(tableData);
          
          // Update the items
          const updatedItems: T[] = [];
          const newTableData = tableData.map(item => {
            if (itemsToUpdate.some(updateItem => this.compareItems(item, updateItem))) {
              const updated = { ...item, ...data };
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
      },
      
      from: this.from.bind(this)
    };
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

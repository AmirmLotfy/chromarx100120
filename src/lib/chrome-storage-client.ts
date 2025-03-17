
import { chromeStorage } from "@/services/chromeStorageService";
import { DbQueryResult, DbListResponse, DbResponse, DbInsertResult, DbSingleResult } from './json-types';

export class ChromeStorageClient {
  auth = {
    getUser: async (): Promise<{ data: { user: { id: string } | null } }> => {
      return { data: { user: { id: 'local-user' } } };
    }
  };

  // Basic query builder for selecting data
  from<T>(table: string): QueryBuilder<T> {
    return new QueryBuilder<T>(table);
  }

  // Mock method for channel
  channel(name: string): { on: (event: string, callback: Function) => void } {
    return {
      on: (event: string, callback: Function) => {
        // Mock implementation that doesn't do anything
        console.log(`Subscribed to ${event} on channel ${name}`);
      }
    };
  }

  // Mock method to remove channel
  removeChannel(name: string): void {
    console.log(`Removed channel ${name}`);
  }
}

export class QueryBuilder<T> {
  private tableName: string;
  private filters: { column: string; value: any }[] = [];
  private orderByColumn: string | null = null;
  private orderDirection: 'asc' | 'desc' = 'asc';
  private limitCount: number | null = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // For getting a single record by id
  async get(id: string): Promise<DbResponse<T>> {
    try {
      const items = await chromeStorage.get<T[]>(this.tableName) || [];
      const item = items.find((item: any) => item.id === id);
      
      return {
        data: item as T,
        error: null
      };
    } catch (error) {
      console.error(`Error getting item from ${this.tableName}:`, error);
      return {
        data: null as unknown as T,
        error
      };
    }
  }

  // Basic selection
  select(): QueryBuilder<T> {
    return this;
  }

  // Filter with an equality condition
  eq(column: string, value: any): QueryBuilder<T> {
    this.filters.push({ column, value });
    return this;
  }

  // Order results
  order(column: string, options: { ascending: boolean } = { ascending: true }): QueryBuilder<T> {
    this.orderByColumn = column;
    this.orderDirection = options.ascending ? 'asc' : 'desc';
    return this;
  }

  // Limit results
  limit(count: number): QueryBuilder<T> {
    this.limitCount = count;
    return this;
  }

  // Insert a new record
  async insert(data: any): DbInsertResult<T> {
    const queryBuilder = this;
    
    return {
      single: async function(): Promise<DbResponse<T>> {
        try {
          const items = await chromeStorage.get<any[]>(queryBuilder.tableName) || [];
          
          // Ensure data has an id
          if (!data.id) {
            data.id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          }
          
          items.push(data);
          await chromeStorage.set(queryBuilder.tableName, items);
          
          return {
            data: data as T,
            error: null
          };
        } catch (error) {
          console.error(`Error inserting into ${queryBuilder.tableName}:`, error);
          return {
            data: null as unknown as T,
            error
          };
        }
      },
      select: async function(): Promise<DbListResponse<T>> {
        try {
          const items = await chromeStorage.get<any[]>(queryBuilder.tableName) || [];
          const lastInserted = items[items.length - 1];
          
          return {
            data: [lastInserted] as T[],
            error: null
          };
        } catch (error) {
          console.error(`Error selecting after insert from ${queryBuilder.tableName}:`, error);
          return {
            data: [],
            error
          };
        }
      },
      execute: async function(): Promise<DbListResponse<T>> {
        try {
          const items = await chromeStorage.get<any[]>(queryBuilder.tableName) || [];
          
          // Ensure data has an id
          if (!data.id) {
            data.id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          }
          
          items.push(data);
          await chromeStorage.set(queryBuilder.tableName, items);
          
          return {
            data: [data] as T[],
            error: null
          };
        } catch (error) {
          console.error(`Error executing insert on ${queryBuilder.tableName}:`, error);
          return {
            data: [],
            error
          };
        }
      },
      error: null
    };
  }

  // Update records
  async update(data: any): DbSingleResult<T> {
    const queryBuilder = this;
    
    return {
      eq: function(column: string, value: any): DbSingleResult<T> {
        queryBuilder.filters.push({ column, value });
        return this;
      },
      select: async function(): Promise<DbListResponse<T>> {
        try {
          let items = await chromeStorage.get<any[]>(queryBuilder.tableName) || [];
          
          // Apply filters
          items = queryBuilder.applyFilters(items);
          
          // Update matching items
          items = items.map(item => {
            return { ...item, ...data };
          });
          
          await chromeStorage.set(queryBuilder.tableName, items);
          
          return {
            data: items as T[],
            error: null
          };
        } catch (error) {
          console.error(`Error updating and selecting from ${queryBuilder.tableName}:`, error);
          return {
            data: [],
            error
          };
        }
      },
      execute: async function(): Promise<DbResponse<T>> {
        try {
          let items = await chromeStorage.get<any[]>(queryBuilder.tableName) || [];
          const originalLength = items.length;
          
          // Apply filters
          const filteredItems = queryBuilder.applyFilters(items);
          const updatedItems = filteredItems.map(item => ({ ...item, ...data }));
          
          // Replace original items with updated ones
          items = items.map(item => {
            const matchingItem = updatedItems.find(updated => {
              return queryBuilder.filters.every(filter => {
                return item[filter.column] === filter.value;
              });
            });
            
            return matchingItem || item;
          });
          
          await chromeStorage.set(queryBuilder.tableName, items);
          
          return {
            data: updatedItems.length > 0 ? updatedItems[0] as T : null as unknown as T,
            error: null
          };
        } catch (error) {
          console.error(`Error executing update on ${queryBuilder.tableName}:`, error);
          return {
            data: null as unknown as T,
            error
          };
        }
      },
      error: null
    };
  }

  // Upsert (update or insert)
  async upsert(data: any): DbSingleResult<T> {
    const queryBuilder = this;
    
    return {
      eq: function(column: string, value: any): DbSingleResult<T> {
        queryBuilder.filters.push({ column, value });
        return this;
      },
      select: async function(): Promise<DbListResponse<T>> {
        return (queryBuilder.update(data) as any).select();
      },
      execute: async function(): Promise<DbResponse<T>> {
        try {
          let items = await chromeStorage.get<any[]>(queryBuilder.tableName) || [];
          
          // Check if item exists based on filters
          const existingItemIndex = items.findIndex(item => {
            return queryBuilder.filters.every(filter => {
              return item[filter.column] === filter.value;
            });
          });
          
          if (existingItemIndex >= 0) {
            // Update existing item
            items[existingItemIndex] = { ...items[existingItemIndex], ...data };
          } else {
            // Insert new item
            if (!data.id) {
              data.id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            }
            items.push(data);
          }
          
          await chromeStorage.set(queryBuilder.tableName, items);
          
          return {
            data: (existingItemIndex >= 0 ? items[existingItemIndex] : data) as T,
            error: null
          };
        } catch (error) {
          console.error(`Error upserting in ${queryBuilder.tableName}:`, error);
          return {
            data: null as unknown as T,
            error
          };
        }
      },
      error: null
    };
  }

  // Delete records
  async delete(): DbSingleResult<T> {
    const queryBuilder = this;
    
    return {
      eq: function(column: string, value: any): DbSingleResult<T> {
        queryBuilder.filters.push({ column, value });
        return this;
      },
      select: async function(): Promise<DbListResponse<T>> {
        try {
          let items = await chromeStorage.get<any[]>(queryBuilder.tableName) || [];
          
          // Find items to be deleted for return
          const itemsToDelete = queryBuilder.applyFilters(items);
          
          // Remove items matching filters
          items = items.filter(item => {
            return !queryBuilder.filters.every(filter => {
              return item[filter.column] === filter.value;
            });
          });
          
          await chromeStorage.set(queryBuilder.tableName, items);
          
          return {
            data: itemsToDelete as T[],
            error: null
          };
        } catch (error) {
          console.error(`Error deleting and selecting from ${queryBuilder.tableName}:`, error);
          return {
            data: [],
            error
          };
        }
      },
      execute: async function(): Promise<DbResponse<T>> {
        try {
          let items = await chromeStorage.get<any[]>(queryBuilder.tableName) || [];
          
          // Find first item to be deleted for return
          const itemsToDelete = queryBuilder.applyFilters(items);
          const firstItemToDelete = itemsToDelete.length > 0 ? itemsToDelete[0] : null;
          
          // Remove items matching filters
          items = items.filter(item => {
            return !queryBuilder.filters.every(filter => {
              return item[filter.column] === filter.value;
            });
          });
          
          await chromeStorage.set(queryBuilder.tableName, items);
          
          return {
            data: firstItemToDelete as T,
            error: null
          };
        } catch (error) {
          console.error(`Error executing delete on ${queryBuilder.tableName}:`, error);
          return {
            data: null as unknown as T,
            error
          };
        }
      },
      error: null
    };
  }

  // Execute the query
  async execute(): Promise<DbListResponse<T>> {
    try {
      let items = await chromeStorage.get<any[]>(this.tableName) || [];
      
      // Apply filters
      items = this.applyFilters(items);
      
      // Apply ordering
      if (this.orderByColumn) {
        items = this.applyOrdering(items);
      }
      
      // Apply limit
      if (this.limitCount !== null) {
        items = items.slice(0, this.limitCount);
      }
      
      // Cast to the proper type with a type assertion
      return {
        data: items as T[],
        error: null
      };
    } catch (error) {
      console.error(`Error executing query on ${this.tableName}:`, error);
      return {
        data: [],
        error
      };
    }
  }

  // Helper method to apply filters
  private applyFilters(items: any[]): any[] {
    if (this.filters.length === 0) {
      return items;
    }
    
    return items.filter(item => {
      return this.filters.every(filter => {
        return item[filter.column] === filter.value;
      });
    });
  }

  // Helper method to apply ordering
  private applyOrdering(items: any[]): any[] {
    if (!this.orderByColumn) {
      return items;
    }
    
    return [...items].sort((a, b) => {
      const aValue = a[this.orderByColumn!];
      const bValue = b[this.orderByColumn!];
      
      if (aValue === bValue) return 0;
      
      const result = aValue < bValue ? -1 : 1;
      return this.orderDirection === 'asc' ? result : -result;
    });
  }
}

export const localStorageClient = new ChromeStorageClient();

// Re-export the type to avoid isolation module errors
export type { Json } from './json-types';

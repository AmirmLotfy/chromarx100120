// This file mocks Supabase client with localStorage-based functionality
// for development and testing purposes

import { v4 as uuidv4 } from 'uuid';

interface StorageItem {
  value: any;
  expiry: number | null;
}

const getStorageKey = (table: string, id?: string) => 
  id ? `local_supabase_${table}_${id}` : `local_supabase_${table}`;

export class LocalStorageClient {
  private prefix: string = 'local_supabase_';

  constructor(prefix?: string) {
    if (prefix) {
      this.prefix = prefix;
    }
  }

  // Auth methods
  auth = {
    getUser: async () => {
      const userStr = localStorage.getItem(`${this.prefix}user`);
      return {
        data: { user: userStr ? JSON.parse(userStr) : null },
        error: null
      };
    },
    // Add other auth methods as needed
  };

  // Storage methods
  storage = {
    // Add storage methods as needed
  };

  // Main database methods
  from(table: string) {
    let query = {
      table,
      filters: [] as any[],
      selectedFields: '*',
      orderField: '',
      orderOptions: { ascending: false } as { ascending: boolean },
      limitCount: -1
    };

    const tableKey = `${this.prefix}${table}`;
    
    // Initialize methods for chaining
    const methods = {
      select: (fields?: string) => {
        if (fields) {
          query.selectedFields = fields;
        }
        
        return {
          ...this.buildFilterMethods(query),
          single: () => this.singlePromise(query),
          execute: () => this.execute(query),
          data: null,
          error: null
        };
      },
      
      insert: (items: any | any[]) => {
        const itemsArray = Array.isArray(items) ? items : [items];
        const now = new Date().toISOString();
        
        const dataToStore = itemsArray.map(item => ({
          ...item,
          id: item.id || uuidv4(),
          created_at: item.created_at || now,
          updated_at: item.updated_at || now
        }));
        
        return {
          select: (fields?: string) => {
            return {
              single: () => this.insertAndReturnSingle(query.table, dataToStore, fields),
              singlePromise: () => this.insertAndReturnSingle(query.table, dataToStore, fields),
              execute: () => this.insertAndReturn(query.table, dataToStore, fields)
            };
          },
          singlePromise: () => this.insertAndReturnSingle(query.table, dataToStore),
          execute: () => this.insertAndReturn(query.table, dataToStore),
          data: null,
          error: null
        };
      },
      
      update: (updates: any) => {
        const now = new Date().toISOString();
        const updateData = {
          ...updates,
          updated_at: now
        };
        
        return {
          ...this.buildFilterMethods(query),
          execute: () => this.update(query, updateData),
          data: null,
          error: null
        };
      },
      
      delete: () => {
        return {
          ...this.buildFilterMethods(query),
          execute: () => this.delete(query),
          eq: (column: string, value: any) => ({
            execute: () => this.deleteWithFilter(query.table, column, value),
          }),
          data: null,
          error: null
        };
      },
      
      eq: (column: string, value: any) => {
        query.filters.push({ type: 'eq', column, value });
        
        return {
          ...this.buildFilterMethods(query),
          order: (orderColumn: string, options?: { ascending?: boolean }) => {
            query.orderField = orderColumn;
            if (options) {
              query.orderOptions = { ...query.orderOptions, ...options };
            }
            
            return {
              execute: () => this.execute(query),
              single: () => this.singlePromise(query),
              data: null,
              error: null
            };
          },
          single: () => this.singlePromise(query),
          execute: () => this.execute(query),
          limit: (count: number) => {
            query.limitCount = count;
            return {
              execute: () => this.execute(query),
              single: () => this.singlePromise(query),
              data: null,
              error: null
            };
          },
          data: null,
          error: null
        };
      },
      
      limit: (count: number) => {
        query.limitCount = count;
        return {
          execute: () => this.execute(query),
          data: null,
          error: null
        };
      },
      
      single: () => this.singlePromise(query),
      singlePromise: () => this.singlePromise(query),
      execute: () => this.execute(query),
      data: null,
      error: null
    };
    
    return methods;
  }

  // Helper to build filter methods
  private buildFilterMethods(query: any) {
    return {
      eq: (column: string, value: any) => {
        query.filters.push({ type: 'eq', column, value });
        return {
          eq: (col: string, val: any) => {
            query.filters.push({ type: 'eq', column: col, value: val });
            return this.buildFilterMethods(query);
          },
          execute: () => this.execute(query),
          single: () => this.singlePromise(query),
          data: null,
          error: null
        };
      },
      
      order: (orderColumn: string, options?: { ascending?: boolean }) => {
        query.orderField = orderColumn;
        if (options) {
          query.orderOptions = { ...query.orderOptions, ...options };
        }
        
        return {
          execute: () => this.execute(query),
          data: null,
          error: null
        };
      },
      
      single: () => this.singlePromise(query),
      singlePromise: () => this.singlePromise(query),
      data: null,
      error: null
    };
  }

  // Execute a query and return multiple results
  private async execute(query: any) {
    try {
      const storageKey = getStorageKey(query.table);
      let items = [];
      
      // Get data from localStorage
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        items = JSON.parse(storedData);
      }
      
      // Apply filters
      let results = items;
      
      if (query.filters && query.filters.length > 0) {
        results = items.filter((item: any) => {
          return query.filters.every((filter: any) => {
            if (filter.type === 'eq') {
              return item[filter.column] === filter.value;
            }
            return true;
          });
        });
      }
      
      // Apply ordering if specified
      if (query.orderField) {
        results.sort((a: any, b: any) => {
          if (query.orderOptions.ascending) {
            return a[query.orderField] > b[query.orderField] ? 1 : -1;
          } else {
            return a[query.orderField] < b[query.orderField] ? 1 : -1;
          }
        });
      }
      
      // Apply limit if specified
      if (query.limitCount > 0) {
        results = results.slice(0, query.limitCount);
      }
      
      return {
        data: results,
        error: null
      };
    } catch (error) {
      console.error('Error executing query:', error);
      return {
        data: null,
        error: 'Error executing query'
      };
    }
  }

  // Get a single result from a query
  private async singlePromise(query: any) {
    try {
      const result = await this.execute(query);
      
      if (result.error) throw result.error;
      
      if (!result.data || result.data.length === 0) {
        return {
          data: null,
          error: 'No results found'
        };
      }
      
      return {
        data: result.data[0],
        error: null
      };
    } catch (error) {
      console.error('Error executing single query:', error);
      return {
        data: null,
        error: 'Error executing single query'
      };
    }
  }
  
  // Insert data and return all inserted items
  private async insertAndReturn(table: string, items: any[], fields?: string) {
    try {
      const storageKey = getStorageKey(table);
      let existingData = [];
      
      // Get existing data from localStorage
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        existingData = JSON.parse(storedData);
      }
      
      // Add new items
      const updatedData = [...existingData, ...items];
      
      // Save back to localStorage
      localStorage.setItem(storageKey, JSON.stringify(updatedData));
      
      return {
        data: items,
        error: null
      };
    } catch (error) {
      console.error('Error inserting data:', error);
      return {
        data: null,
        error: 'Error inserting data'
      };
    }
  }
  
  // Insert data and return the first inserted item
  private async insertAndReturnSingle(table: string, items: any[], fields?: string) {
    try {
      const result = await this.insertAndReturn(table, items, fields);
      
      if (result.error) throw result.error;
      
      return {
        data: result.data[0],
        error: null
      };
    } catch (error) {
      console.error('Error inserting data:', error);
      return {
        data: null,
        error: 'Error inserting data'
      };
    }
  }
  
  // Update items based on query filters
  private async update(query: any, updates: any) {
    try {
      const storageKey = getStorageKey(query.table);
      let items = [];
      
      // Get data from localStorage
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        items = JSON.parse(storedData);
      }
      
      // Apply filters and update
      const updatedItems = items.map((item: any) => {
        // Check if this item matches all filters
        const matches = query.filters.every((filter: any) => {
          if (filter.type === 'eq') {
            return item[filter.column] === filter.value;
          }
          return true;
        });
        
        // If matches, apply updates
        if (matches) {
          return { ...item, ...updates };
        }
        
        return item;
      });
      
      // Save back to localStorage
      localStorage.setItem(storageKey, JSON.stringify(updatedItems));
      
      // Get the updated items to return
      const result = await this.execute(query);
      
      return {
        data: result.data,
        error: null
      };
    } catch (error) {
      console.error('Error updating data:', error);
      return {
        data: null,
        error: 'Error updating data'
      };
    }
  }
  
  // Delete items based on query filters
  private async delete(query: any) {
    try {
      const storageKey = getStorageKey(query.table);
      let items = [];
      
      // Get data from localStorage
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        items = JSON.parse(storedData);
      }
      
      // Apply filters (keep items that don't match)
      const remainingItems = items.filter((item: any) => {
        return !query.filters.every((filter: any) => {
          if (filter.type === 'eq') {
            return item[filter.column] === filter.value;
          }
          return true;
        });
      });
      
      // Save back to localStorage
      localStorage.setItem(storageKey, JSON.stringify(remainingItems));
      
      return {
        data: { success: true },
        error: null
      };
    } catch (error) {
      console.error('Error deleting data:', error);
      return {
        data: null,
        error: 'Error deleting data'
      };
    }
  }
  
  // Helper for direct delete with a single equality filter
  private async deleteWithFilter(table: string, column: string, value: any) {
    try {
      const storageKey = getStorageKey(table);
      let items = [];
      
      // Get data from localStorage
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        items = JSON.parse(storedData);
      }
      
      // Keep items that don't match the filter
      const remainingItems = items.filter((item: any) => item[column] !== value);
      
      // Save back to localStorage
      localStorage.setItem(storageKey, JSON.stringify(remainingItems));
      
      return {
        data: { success: true },
        error: null
      };
    } catch (error) {
      console.error('Error deleting data:', error);
      return {
        data: null,
        error: 'Error deleting data'
      };
    }
  }

  // Method to subscribe to realtime changes
  subscribe(channel: string, callback: (payload: any) => void) {
    console.log(`Subscription to ${channel} would happen here with Supabase`);
    
    // Return a dummy subscription object that can be unsubscribed
    return {
      unsubscribe: () => {
        console.log(`Unsubscribed from ${channel}`);
      }
    };
  }
}

// Create and export the singleton instance
export const localStorageClient = new LocalStorageClient();

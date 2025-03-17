import { DbResponse, DbListResponse, DbQueryResult, DbSingleResult, DbInsertResult } from './json-types';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// This is a mock implementation that mimics Supabase client for local storage
class LocalStorageClient {
  private getTableData<T>(tableName: string): T[] {
    try {
      const data = localStorage.getItem(`table_${tableName}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error getting data from table ${tableName}:`, error);
      return [];
    }
  }

  private saveTableData<T>(tableName: string, data: T[]): void {
    try {
      localStorage.setItem(`table_${tableName}`, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving data to table ${tableName}:`, error);
    }
  }

  auth = {
    getUser: async () => ({ data: { user: { id: 'demo-user-id' } } }),
    signIn: async () => ({ data: {}, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: {}, error: null })
  };

  from(table: string) {
    return {
      select: (fields?: string): DbQueryResult<any> => {
        let filters: Array<{ column: string; value: any }> = [];
        let orderByColumn: string | null = null;
        let ascending = true;
        
        const execute = async () => {
          try {
            let data = this.getTableData(table);
            
            // Apply filters
            if (filters.length > 0) {
              data = data.filter(item => 
                filters.every(filter => item[filter.column] === filter.value)
              );
            }
            
            // Apply ordering
            if (orderByColumn) {
              data.sort((a, b) => {
                if (a[orderByColumn!] < b[orderByColumn!]) return ascending ? -1 : 1;
                if (a[orderByColumn!] > b[orderByColumn!]) return ascending ? 1 : -1;
                return 0;
              });
            }
            
            return { data, error: null };
          } catch (error) {
            console.error(`Error executing select on ${table}:`, error);
            return { data: null, error };
          }
        };

        return {
          eq: (column: string, value: any): DbQueryResult<any> => {
            filters.push({ column, value });
            return {
              eq: (col: string, val: any): DbQueryResult<any> => {
                filters.push({ column: col, value: val });
                return this.from(table).select().eq(col, val);
              },
              order: (column: string, options?: { ascending: boolean }): DbQueryResult<any> => {
                orderByColumn = column;
                ascending = options?.ascending ?? true;
                return {
                  eq: this.from(table).select().eq,
                  order: this.from(table).select().order,
                  execute,
                  data: [],
                  error: null
                };
              },
              execute,
              data: [],
              error: null
            };
          },
          order: (column: string, options?: { ascending: boolean }): DbQueryResult<any> => {
            orderByColumn = column;
            ascending = options?.ascending ?? true;
            return {
              eq: this.from(table).select().eq,
              order: this.from(table).select().order,
              execute,
              data: [],
              error: null
            };
          },
          execute,
          data: [],
          error: null
        };
      },
      
      insert: (data: any): DbInsertResult<any> => {
        const execute = async () => {
          try {
            const tableData = this.getTableData(table);
            const newData = Array.isArray(data) ? data : [data];
            
            // Add created_at and updated_at if not present
            const now = new Date().toISOString();
            const dataWithTimestamps = newData.map(item => ({
              ...item,
              created_at: item.created_at || now,
              updated_at: item.updated_at || now
            }));
            
            // Add the new data
            const updatedData = [...tableData, ...dataWithTimestamps];
            this.saveTableData(table, updatedData);
            
            return { data: dataWithTimestamps, error: null };
          } catch (error) {
            console.error(`Error executing insert on ${table}:`, error);
            return { data: null, error };
          }
        };
        
        return {
          single: async () => {
            const result = await execute();
            return { 
              data: result.data ? result.data[0] : null, 
              error: result.error 
            };
          },
          select: async () => {
            const result = await execute();
            return result;
          },
          execute,
          error: null
        };
      },
      
      update: (data: any): DbSingleResult<any> => {
        let filters: Array<{ column: string; value: any }> = [];
        
        const execute = async () => {
          try {
            if (filters.length === 0) {
              throw new Error('No filters provided for update operation');
            }
            
            const tableData = this.getTableData(table);
            const now = new Date().toISOString();
            
            // Find items to update
            const updatedData = tableData.map(item => {
              if (filters.every(filter => item[filter.column] === filter.value)) {
                return { 
                  ...item, 
                  ...data, 
                  updated_at: data.updated_at || now 
                };
              }
              return item;
            });
            
            this.saveTableData(table, updatedData);
            
            // Get updated items
            const updatedItems = updatedData.filter(item => 
              filters.every(filter => item[filter.column] === filter.value)
            );
            
            return { data: updatedItems, error: null };
          } catch (error) {
            console.error(`Error executing update on ${table}:`, error);
            return { data: null, error };
          }
        };
        
        return {
          eq: (column: string, value: any): DbSingleResult<any> => {
            filters.push({ column, value });
            return {
              eq: (col: string, val: any): DbSingleResult<any> => {
                filters.push({ column: col, value: val });
                return this.from(table).update(data).eq(col, val);
              },
              select: async () => {
                const result = await execute();
                return result;
              },
              execute,
              error: null
            };
          },
          select: async () => {
            const result = await execute();
            return result;
          },
          execute,
          error: null
        };
      },
      
      delete: () => {
        let filters: Array<{ column: string; value: any }> = [];
        
        const execute = async () => {
          try {
            if (filters.length === 0) {
              throw new Error('No filters provided for delete operation');
            }
            
            const tableData = this.getTableData(table);
            
            // Find items to delete
            const itemsToDelete = tableData.filter(item => 
              filters.every(filter => item[filter.column] === filter.value)
            );
            
            // Keep items that don't match the filter
            const remainingData = tableData.filter(item => 
              !filters.every(filter => item[filter.column] === filter.value)
            );
            
            this.saveTableData(table, remainingData);
            
            return { data: itemsToDelete, error: null };
          } catch (error) {
            console.error(`Error executing delete on ${table}:`, error);
            return { data: null, error };
          }
        };
        
        return {
          eq: (column: string, value: any) => {
            filters.push({ column, value });
            return {
              eq: (col: string, val: any) => {
                filters.push({ column: col, value: val });
                return {
                  eq: (column2: string, value2: any) => {
                    filters.push({ column: column2, value: value2 });
                    return {
                      execute,
                      error: null
                    };
                  },
                  execute,
                  error: null
                };
              },
              execute,
              error: null
            };
          }
        };
      },
      
      upsert: (data: any) => {
        return this.from(table).insert(data);
      },
      
      eq: (column: string, value: any) => {
        let filters: Array<{ column: string; value: any }> = [];
        filters.push({ column, value });
        
        const execute = async () => {
          try {
            let data = this.getTableData(table);
            
            // Apply filters
            if (filters.length > 0) {
              data = data.filter(item => 
                filters.every(filter => item[filter.column] === filter.value)
              );
            }
            
            return { data, error: null };
          } catch (error) {
            console.error(`Error executing eq query on ${table}:`, error);
            return { data: null, error };
          }
        };
        
        return {
          eq: (col: string, val: any) => {
            filters.push({ column: col, value: val });
            return {
              select: () => this.from(table).select(),
              execute,
              order: (orderColumn: string, options?: { ascending: boolean }) => {
                return { 
                  eq: this.from(table).eq,
                  order: this.from(table).order,
                  execute,
                  data: [],
                  error: null
                };
              },
              data: [],
              error: null
            };
          },
          select: () => this.from(table).select(),
          execute,
          order: (orderColumn: string, options?: { ascending: boolean }) => {
            return { 
              eq: this.from(table).eq,
              order: this.from(table).order,
              execute,
              data: [],
              error: null
            };
          },
          data: [],
          error: null
        };
      },
      
      order: (column: string, options?: { ascending: boolean }) => {
        return { 
          eq: this.from(table).eq,
          order: this.from(table).order,
          execute: async () => ({ data: this.getTableData(table), error: null }),
          data: [],
          error: null
        };
      }
    };
  }

  // Add realtime subscription methods (no-op in local storage version)
  channel(channelName: string) {
    return {
      on: (event: string, config: any, callback: (payload: any) => void) => {
        return { 
          subscribe: () => ({ data: {}, error: null }) 
        };
      },
      unsubscribe: () => {}
    };
  }

  removeChannel(channel: any) {
    return Promise.resolve({ data: {}, error: null });
  }
}

export const localStorageClient = new LocalStorageClient();

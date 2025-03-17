
// This is a mock implementation of Supabase client for local development
// It uses localStorage to simulate a database

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export class LocalStorageClient {
  auth = {
    getUser: async () => ({
      data: {
        user: { id: 'mock-user-id', email: 'mock@example.com' }
      }
    }),
    signIn: async () => ({
      data: {
        user: { id: 'mock-user-id', email: 'mock@example.com' }
      },
      error: null
    }),
    signOut: async () => ({ error: null })
  };

  // Channel methods for realtime subscriptions
  channel(channelName: string) {
    return {
      on: (event: string, table: string, callback: Function) => {
        console.log(`Subscribed to ${event} on ${table} in channel ${channelName}`);
        return this;
      },
      subscribe: (callback?: Function) => {
        console.log(`Subscribed to channel ${channelName}`);
        if (callback) callback();
        return Promise.resolve(this);
      }
    }
  }

  removeChannel(channelName: string) {
    console.log(`Removed channel ${channelName}`);
    return Promise.resolve();
  }

  // Functions API
  functions = {
    invoke: (functionName: string, options?: any) => {
      console.log(`Invoking function ${functionName} with options:`, options);
      
      // For AITips component which expects specific data structure
      if (functionName === 'analyze-productivity') {
        return Promise.resolve({
          data: {
            insights: {
              summary: "Based on your activity, you seem to be most productive in the morning.",
              patterns: ["High focus sessions between 9-11 AM", "Productivity drops after lunch"],
              recommendations: ["Schedule important tasks in the morning", "Take longer breaks"],
              alerts: ["Frequent context switching detected"],
              domainSpecificTips: { "example.com": "This site is consuming a lot of your time" },
              productivityByDomain: [{ domain: "work-tool.com", score: 85 }],
              goalProgress: [{ category: "Development", current: 10, target: 20 }]
            }
          },
          error: null
        });
      }
      
      return Promise.resolve({ data: { result: 'mock-result' }, error: null });
    }
  };

  // This method should be used directly for subscribing to channels
  subscribe(callback?: Function) {
    if (callback) callback();
    return this;
  }

  from(tableName: string) {
    return {
      select: (columns?: string | string[]) => {
        const builder = {
          eq: (column: string, value: any) => {
            return {
              order: (orderColumn: string, options?: { ascending?: boolean }) => {
                return {
                  limit: (count: number) => {
                    return {
                      execute: () => this.executeQuery(tableName, { column, value, orderBy: orderColumn, limit: count, ...options }),
                      data: null,
                      error: null
                    }
                  },
                  execute: () => this.executeQuery(tableName, { column, value, orderBy: orderColumn, ...options }),
                  single: () => this.executeSingleQuery(tableName, { column, value }),
                  data: null,
                  error: null
                }
              },
              limit: (count: number) => {
                return {
                  execute: () => this.executeQuery(tableName, { column, value, limit: count }),
                  data: null,
                  error: null
                }
              },
              single: () => this.executeSingleQuery(tableName, { column, value }),
              execute: () => this.executeQuery(tableName, { column, value }),
              data: null,
              error: null
            }
          },
          neq: (column: string, value: any) => {
            return {
              execute: () => this.executeQuery(tableName, { column, value, operator: 'neq' }),
              data: null,
              error: null
            }
          },
          order: (orderColumn: string, options?: { ascending?: boolean }) => {
            return {
              limit: (count: number) => {
                return {
                  execute: () => this.executeQuery(tableName, { orderBy: orderColumn, limit: count, ...options }),
                  data: null,
                  error: null
                }
              },
              execute: () => this.executeQuery(tableName, { orderBy: orderColumn, ...options }),
              data: null,
              error: null
            }
          },
          limit: (count: number) => {
            return {
              execute: () => this.executeQuery(tableName, { limit: count }),
              data: null,
              error: null
            }
          },
          execute: () => this.executeQuery(tableName),
          single: () => this.executeSingleQuery(tableName),
          data: null,
          error: null
        };
        
        return builder;
      },
      insert: (data: any) => {
        return {
          select: () => {
            const result = this.insertData(tableName, data);
            return result;
          },
          single: () => this.insertData(tableName, data),
          data: null,
          error: null
        }
      },
      update: (data: any) => {
        return {
          eq: (column: string, value: any) => {
            return {
              select: () => {
                const result = this.updateData(tableName, column, value, data);
                return result;
              },
              single: () => this.updateData(tableName, column, value, data),
              execute: () => this.updateData(tableName, column, value, data),
              data: null,
              error: null
            }
          },
          select: () => {
            return {
              single: () => Promise.resolve({ data, error: null }),
              data: null,
              error: null
            }
          },
          execute: () => Promise.resolve({ data: { success: true }, error: null }),
          data: null,
          error: null
        }
      },
      delete: () => {
        return {
          eq: (column: string, value: any) => {
            return {
              execute: () => this.deleteData(tableName, column, value),
              data: null,
              error: null
            }
          },
          execute: () => Promise.resolve({ data: { success: true }, error: null }),
          data: null,
          error: null
        }
      },
      upsert: (data: any) => {
        return this.upsertData(tableName, data);
      }
    }
  }

  private executeQuery(tableName: string, options?: any) {
    const storageKey = `${tableName}_data`;
    const data = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    let filteredData = [...data];
    
    if (options?.column && options?.value) {
      if (options?.operator === 'neq') {
        filteredData = filteredData.filter(item => item[options.column] !== options.value);
      } else {
        filteredData = filteredData.filter(item => item[options.column] === options.value);
      }
    }
    
    if (options?.orderBy) {
      filteredData.sort((a, b) => {
        if (options?.ascending) {
          return a[options.orderBy] > b[options.orderBy] ? 1 : -1;
        } else {
          return a[options.orderBy] < b[options.orderBy] ? 1 : -1;
        }
      });
    }
    
    if (options?.limit) {
      filteredData = filteredData.slice(0, options.limit);
    }
    
    return Promise.resolve({ data: filteredData, error: null });
  }

  private executeSingleQuery(tableName: string, options?: any) {
    return this.executeQuery(tableName, options)
      .then(result => {
        if (result.data.length > 0) {
          return { data: result.data[0], error: null };
        } else {
          return { data: null, error: 'No records found' };
        }
      });
  }

  private insertData(tableName: string, data: any) {
    const storageKey = `${tableName}_data`;
    const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // If it's an array, add all items
    if (Array.isArray(data)) {
      existingData.push(...data);
    } else {
      existingData.push(data);
    }
    
    localStorage.setItem(storageKey, JSON.stringify(existingData));
    return Promise.resolve({ data, error: null });
  }

  private updateData(tableName: string, column: string, value: any, newData: any) {
    const storageKey = `${tableName}_data`;
    const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    const updatedData = existingData.map((item: any) => {
      if (item[column] === value) {
        return { ...item, ...newData };
      }
      return item;
    });
    
    localStorage.setItem(storageKey, JSON.stringify(updatedData));
    const updated = updatedData.find((item: any) => item[column] === value);
    return Promise.resolve({ data: updated, error: null });
  }

  private deleteData(tableName: string, column: string, value: any) {
    const storageKey = `${tableName}_data`;
    const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    const filteredData = existingData.filter((item: any) => item[column] !== value);
    
    localStorage.setItem(storageKey, JSON.stringify(filteredData));
    return Promise.resolve({ data: { success: true }, error: null });
  }

  private upsertData(tableName: string, data: any) {
    // This is a simplified implementation
    return Promise.resolve({ data, error: null });
  }
}

export const localStorageClient = new LocalStorageClient();

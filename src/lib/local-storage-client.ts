
// This is a simplified implementation of Supabase client using localStorage
// to be used as a fallback when Supabase is not available

type StorageData = Record<string, any[]>;

class LocalStorageClient {
  private storage: StorageData = {};
  private channelListeners: Record<string, Function[]> = {};
  private prefix = 'app_data_';

  constructor() {
    // Load data from localStorage on initialization
    this.loadData();
  }

  private loadData() {
    try {
      // Get all localStorage keys that match our prefix
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .forEach(key => {
          const tableName = key.replace(this.prefix, '');
          const data = JSON.parse(localStorage.getItem(key) || '[]');
          this.storage[tableName] = Array.isArray(data) ? data : [];
        });
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
  }

  private saveTable(tableName: string) {
    try {
      localStorage.setItem(
        `${this.prefix}${tableName}`,
        JSON.stringify(this.storage[tableName] || [])
      );
    } catch (error) {
      console.error(`Error saving table ${tableName} to localStorage:`, error);
    }
  }

  private ensureTable(tableName: string) {
    if (!this.storage[tableName]) {
      this.storage[tableName] = [];
    }
    return this.storage[tableName];
  }

  private uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  public from(tableName: string) {
    const client = this;
    
    return {
      select: function(columns?: string | string[]) {
        return {
          eq: function(column: string, value: any) {
            return {
              order: function(orderColumn: string, options?: { ascending?: boolean }) {
                return {
                  execute: function() {
                    try {
                      const tableData = client.ensureTable(tableName);
                      let filteredData = tableData.filter(item => item[column] === value);
                      
                      // Sort the data
                      const isAscending = options?.ascending !== false;
                      filteredData.sort((a, b) => {
                        return isAscending 
                          ? (a[orderColumn] > b[orderColumn] ? 1 : -1)
                          : (a[orderColumn] < b[orderColumn] ? 1 : -1);
                      });
                      
                      return Promise.resolve({
                        data: filteredData,
                        error: null
                      });
                    } catch (error) {
                      return Promise.resolve({
                        data: [],
                        error: error
                      });
                    }
                  },
                  single: function() {
                    try {
                      const tableData = client.ensureTable(tableName);
                      const item = tableData.find(item => item[column] === value);
                      
                      return Promise.resolve({
                        data: item || null,
                        error: item ? null : "No record found"
                      });
                    } catch (error) {
                      return Promise.resolve({
                        data: null,
                        error: error
                      });
                    }
                  }
                };
              },
              single: function() {
                try {
                  const tableData = client.ensureTable(tableName);
                  const item = tableData.find(item => item[column] === value);
                  
                  return Promise.resolve({
                    data: item || null,
                    error: item ? null : "No record found"
                  });
                } catch (error) {
                  return Promise.resolve({
                    data: null,
                    error: error
                  });
                }
              },
              execute: function() {
                try {
                  const tableData = client.ensureTable(tableName);
                  const filteredData = tableData.filter(item => item[column] === value);
                  
                  return Promise.resolve({
                    data: filteredData,
                    error: null
                  });
                } catch (error) {
                  return Promise.resolve({
                    data: [],
                    error: error
                  });
                }
              }
            };
          },
          neq: function(column: string, value: any) {
            return {
              execute: function() {
                try {
                  const tableData = client.ensureTable(tableName);
                  const filteredData = tableData.filter(item => item[column] !== value);
                  
                  return Promise.resolve({
                    data: filteredData,
                    error: null
                  });
                } catch (error) {
                  return Promise.resolve({
                    data: [],
                    error: error
                  });
                }
              }
            };
          },
          order: function(column: string, options?: { ascending?: boolean }) {
            return {
              execute: function() {
                try {
                  const tableData = client.ensureTable(tableName);
                  const isAscending = options?.ascending !== false;
                  
                  // Clone and sort the data
                  const sortedData = [...tableData].sort((a, b) => {
                    return isAscending 
                      ? (a[column] > b[column] ? 1 : -1)
                      : (a[column] < b[column] ? 1 : -1);
                  });
                  
                  return Promise.resolve({
                    data: sortedData,
                    error: null
                  });
                } catch (error) {
                  return Promise.resolve({
                    data: [],
                    error: error
                  });
                }
              }
            };
          },
          single: function() {
            try {
              const tableData = client.ensureTable(tableName);
              const item = tableData.length > 0 ? tableData[0] : null;
              
              return Promise.resolve({
                data: item,
                error: item ? null : "No record found"
              });
            } catch (error) {
              return Promise.resolve({
                data: null,
                error: error
              });
            }
          },
          execute: function() {
            try {
              const tableData = client.ensureTable(tableName);
              
              return Promise.resolve({
                data: tableData,
                error: null
              });
            } catch (error) {
              return Promise.resolve({
                data: [],
                error: error
              });
            }
          }
        };
      },
      insert: function(data: any) {
        return {
          select: function() {
            try {
              const tableData = client.ensureTable(tableName);
              
              // If data is an array, insert all items
              const items = Array.isArray(data) ? data : [data];
              items.forEach(item => {
                if (!item.id) {
                  item.id = client.uuid();
                }
                tableData.push(item);
              });
              
              client.saveTable(tableName);
              
              // Notify listeners about the changes
              client.notifyChannelListeners(tableName, 'INSERT', items);
              
              return Promise.resolve({
                data: items,
                error: null
              });
            } catch (error) {
              return Promise.resolve({
                data: null,
                error: error
              });
            }
          },
          single: function() {
            try {
              const tableData = client.ensureTable(tableName);
              
              // Ensure it's a single item
              const item = Array.isArray(data) ? data[0] : data;
              
              if (!item.id) {
                item.id = client.uuid();
              }
              
              tableData.push(item);
              client.saveTable(tableName);
              
              // Notify listeners about the change
              client.notifyChannelListeners(tableName, 'INSERT', [item]);
              
              return Promise.resolve({
                data: item,
                error: null
              });
            } catch (error) {
              return Promise.resolve({
                data: null,
                error: error
              });
            }
          }
        };
      },
      update: function(data: any) {
        return {
          eq: function(column: string, value: any) {
            return {
              select: function() {
                try {
                  const tableData = client.ensureTable(tableName);
                  const updatedItems = [];
                  
                  tableData.forEach((item, index) => {
                    if (item[column] === value) {
                      tableData[index] = { ...item, ...data };
                      updatedItems.push(tableData[index]);
                    }
                  });
                  
                  client.saveTable(tableName);
                  
                  // Notify listeners about the changes
                  client.notifyChannelListeners(tableName, 'UPDATE', updatedItems);
                  
                  return Promise.resolve({
                    data: updatedItems,
                    error: null
                  });
                } catch (error) {
                  return Promise.resolve({
                    data: null,
                    error: error
                  });
                }
              },
              single: function() {
                try {
                  const tableData = client.ensureTable(tableName);
                  let updatedItem = null;
                  
                  tableData.forEach((item, index) => {
                    if (item[column] === value) {
                      tableData[index] = { ...item, ...data };
                      updatedItem = tableData[index];
                      return false; // Break the loop
                    }
                  });
                  
                  client.saveTable(tableName);
                  
                  if (updatedItem) {
                    // Notify listeners about the change
                    client.notifyChannelListeners(tableName, 'UPDATE', [updatedItem]);
                  }
                  
                  return Promise.resolve({
                    data: updatedItem,
                    error: updatedItem ? null : "No record found"
                  });
                } catch (error) {
                  return Promise.resolve({
                    data: null,
                    error: error
                  });
                }
              }
            };
          }
        };
      },
      delete: function() {
        return {
          eq: function(column: string, value: any) {
            return {
              execute: function() {
                try {
                  const tableData = client.ensureTable(tableName);
                  const deletedItems = [];
                  
                  client.storage[tableName] = tableData.filter(item => {
                    if (item[column] === value) {
                      deletedItems.push(item);
                      return false;
                    }
                    return true;
                  });
                  
                  client.saveTable(tableName);
                  
                  // Notify listeners about the changes
                  client.notifyChannelListeners(tableName, 'DELETE', deletedItems);
                  
                  return Promise.resolve({
                    data: { success: true },
                    error: null
                  });
                } catch (error) {
                  return Promise.resolve({
                    data: { success: false },
                    error: error
                  });
                }
              }
            };
          }
        };
      },
      upsert: function(data: any, options?: { onConflict?: string }) {
        try {
          const tableData = client.ensureTable(tableName);
          const items = Array.isArray(data) ? data : [data];
          const upsertedItems = [];
          
          items.forEach(item => {
            const conflictColumn = options?.onConflict || 'id';
            const existingIndex = tableData.findIndex(existing => existing[conflictColumn] === item[conflictColumn]);
            
            if (existingIndex >= 0) {
              // Update existing item
              tableData[existingIndex] = { ...tableData[existingIndex], ...item };
              upsertedItems.push(tableData[existingIndex]);
              client.notifyChannelListeners(tableName, 'UPDATE', [tableData[existingIndex]]);
            } else {
              // Insert new item
              if (!item.id) {
                item.id = client.uuid();
              }
              tableData.push(item);
              upsertedItems.push(item);
              client.notifyChannelListeners(tableName, 'INSERT', [item]);
            }
          });
          
          client.saveTable(tableName);
          
          return Promise.resolve({
            data: upsertedItems,
            error: null
          });
        } catch (error) {
          return Promise.resolve({
            data: null,
            error: error
          });
        }
      }
    };
  }

  public auth = {
    getUser: async () => {
      try {
        const userData = localStorage.getItem(`${this.prefix}user`);
        if (userData) {
          return {
            data: { user: JSON.parse(userData) },
            error: null
          };
        }
        return {
          data: { user: null },
          error: null
        };
      } catch (error) {
        return {
          data: { user: null },
          error: error
        };
      }
    },
    signIn: async (credentials: { email: string; password: string }) => {
      try {
        // Simulate a successful sign-in
        const user = {
          id: this.uuid(),
          email: credentials.email,
          created_at: new Date().toISOString()
        };
        
        localStorage.setItem(`${this.prefix}user`, JSON.stringify(user));
        
        return {
          data: { user },
          error: null
        };
      } catch (error) {
        return {
          data: { user: null },
          error: error
        };
      }
    },
    signOut: async () => {
      try {
        localStorage.removeItem(`${this.prefix}user`);
        return {
          error: null
        };
      } catch (error) {
        return {
          error: error
        };
      }
    }
  };

  public functions = {
    invoke: async (functionName: string, payload: any = {}) => {
      try {
        // Simulate function call
        console.log(`Invoking function: ${functionName} with payload:`, payload);
        
        return {
          data: { success: true, message: "Function executed in mock mode" },
          error: null
        };
      } catch (error) {
        return {
          data: null,
          error: error
        };
      }
    }
  };

  public channel(name: string) {
    return {
      on: (event: string, schema: string, table: string, callback: Function) => {
        const channelId = `${name}-${event}-${schema}-${table}`;
        if (!this.channelListeners[channelId]) {
          this.channelListeners[channelId] = [];
        }
        this.channelListeners[channelId].push(callback);
        return this;
      },
      subscribe: () => {
        console.log(`Subscribed to channel: ${name}`);
        return this;
      }
    };
  }

  public removeChannel(channel: any) {
    // Simulate removing a channel
    console.log('Removing channel:', channel);
    return true;
  }

  private notifyChannelListeners(tableName: string, event: 'INSERT' | 'UPDATE' | 'DELETE', items: any[]) {
    // Find all listeners for this table and event
    Object.keys(this.channelListeners).forEach(channelId => {
      if (channelId.includes(tableName) && channelId.includes(event)) {
        items.forEach(item => {
          this.channelListeners[channelId].forEach(callback => {
            callback({
              eventType: event,
              table: tableName,
              schema: 'public',
              new: event !== 'DELETE' ? item : null,
              old: event !== 'INSERT' ? item : null
            });
          });
        });
      }
    });
  }
}

export const localStorageClient = new LocalStorageClient();

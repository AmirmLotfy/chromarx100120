
/**
 * A local storage based replacement for Supabase client
 * This provides a mock implementation with similar API structure
 */

type Table = {
  [key: string]: any[];
};

type LocalDatabase = {
  [tableName: string]: Table;
};

// In-memory database simulation
const localDb: LocalDatabase = {};

// Helper function to save to localStorage
const persistDb = () => {
  try {
    localStorage.setItem('localDatabase', JSON.stringify(localDb));
  } catch (error) {
    console.error('Error persisting database to localStorage:', error);
  }
};

// Initialize from localStorage if available
const initFromStorage = () => {
  try {
    const storedDb = localStorage.getItem('localDatabase');
    if (storedDb) {
      Object.assign(localDb, JSON.parse(storedDb));
    }
  } catch (error) {
    console.error('Error loading database from localStorage:', error);
  }
};

initFromStorage();

// Mock auth methods
const auth = {
  getUser: async () => {
    return {
      data: {
        user: { id: 'local-user-id', email: 'demo@example.com' }
      },
      error: null
    };
  },
  signIn: async () => {
    return { 
      data: { user: { id: 'local-user-id', email: 'demo@example.com' } }, 
      error: null 
    };
  },
  signOut: async () => {
    return { error: null };
  }
};

// Mock functions API
const functions = {
  invoke: async (functionName: string, options: any = {}) => {
    console.log(`Mock function invocation: ${functionName}`, options);
    
    // Return mock data based on function name
    if (functionName === 'analyze-productivity') {
      return {
        data: {
          insights: {
            summary: "You've been productive this week! Your focus has improved by 15% compared to last week.",
            patterns: ["You're most productive on Tuesday mornings", "You tend to get distracted after lunch"],
            recommendations: ["Try taking a short break every 90 minutes", "Schedule focus time in the morning"],
            alerts: ["You've spent more than 4 hours on social media this week"],
            domainSpecificTips: {
              "example.com": "This site seems to help your productivity",
              "social-media.com": "Consider limiting time on this site"
            },
            productivityByDomain: [
              { domain: "docs.google.com", score: 85 },
              { domain: "github.com", score: 90 },
              { domain: "social-media.com", score: 45 }
            ],
            goalProgress: [
              { category: "Deep Work", current: 12, target: 15 },
              { category: "Learning", current: 5, target: 10 },
              { category: "Communication", current: 8, target: 5 }
            ]
          }
        },
        error: null
      };
    }
    
    return { data: {}, error: null };
  }
};

// Create a chainable query builder for table operations
const createQueryBuilder = (tableName: string) => {
  // Ensure table exists
  if (!localDb[tableName]) {
    localDb[tableName] = {};
  }
  
  let filteredData: any[] = [];
  let currentTable = tableName;
  let whereConditions: { column: string; value: any; operator: string }[] = [];
  let orderByColumn: string | null = null;
  let orderDirection: 'asc' | 'desc' = 'asc';
  let limitCount: number | null = null;
  let selectColumns: string[] | null = null;
  
  const builder = {
    select: (columns: string | string[] = '*') => {
      selectColumns = columns === '*' ? null : (Array.isArray(columns) ? columns : [columns]);
      return builder;
    },
    
    from: (table: string) => {
      currentTable = table;
      return builder;
    },
    
    eq: (column: string, value: any) => {
      whereConditions.push({ column, value, operator: 'eq' });
      return builder;
    },
    
    neq: (column: string, value: any) => {
      whereConditions.push({ column, value, operator: 'neq' });
      return builder;
    },
    
    order: (column: string, options: { ascending?: boolean } = {}) => {
      orderByColumn = column;
      orderDirection = options.ascending === false ? 'desc' : 'asc';
      return builder;
    },
    
    limit: (count: number) => {
      limitCount = count;
      return builder;
    },
    
    single: async () => {
      const result = await builder.execute();
      return {
        data: result.data.length > 0 ? result.data[0] : null,
        error: null
      };
    },
    
    execute: async () => {
      try {
        // Get data from the current table or return empty array
        const tableData = Object.values(localDb[currentTable] || {}).flat();
        
        // Apply where conditions
        filteredData = tableData.filter(row => {
          return whereConditions.every(condition => {
            if (condition.operator === 'eq') {
              return row[condition.column] === condition.value;
            } else if (condition.operator === 'neq') {
              return row[condition.column] !== condition.value;
            }
            return true;
          });
        });
        
        // Apply order by
        if (orderByColumn) {
          filteredData.sort((a, b) => {
            if (a[orderByColumn] < b[orderByColumn]) return orderDirection === 'asc' ? -1 : 1;
            if (a[orderByColumn] > b[orderByColumn]) return orderDirection === 'asc' ? 1 : -1;
            return 0;
          });
        }
        
        // Apply limit
        if (limitCount !== null) {
          filteredData = filteredData.slice(0, limitCount);
        }
        
        // Apply select
        if (selectColumns) {
          filteredData = filteredData.map(row => {
            const newRow: { [key: string]: any } = {};
            selectColumns.forEach(column => {
              newRow[column] = row[column];
            });
            return newRow;
          });
        }
        
        return { data: filteredData, error: null };
      } catch (error) {
        console.error('Error executing query:', error);
        return { data: [], error: 'Query execution error' };
      }
    },
    
    insert: (data: any | any[]) => {
      return {
        select: async () => {
          const dataArray = Array.isArray(data) ? data : [data];
          const newId = `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          
          dataArray.forEach(item => {
            const id = item.id || newId;
            if (!localDb[currentTable][id]) {
              localDb[currentTable][id] = [];
            }
            const newItem = { ...item, id };
            localDb[currentTable][id].push(newItem);
          });
          
          persistDb();
          
          return { 
            data: dataArray.map(item => ({ ...item, id: item.id || newId })),
            error: null
          };
        },
        single: async () => {
          const result = await builder.insert(data).select();
          return {
            data: Array.isArray(result.data) && result.data.length > 0 ? result.data[0] : null,
            error: result.error
          };
        }
      };
    },
    
    update: (data: any) => {
      return {
        eq: async (column: string, value: any) => {
          try {
            let updated = false;
            
            Object.keys(localDb[currentTable]).forEach(key => {
              localDb[currentTable][key] = localDb[currentTable][key].map(item => {
                if (item[column] === value) {
                  updated = true;
                  return { ...item, ...data };
                }
                return item;
              });
            });
            
            persistDb();
            
            return { data: updated ? data : null, error: null };
          } catch (error) {
            console.error('Error updating data:', error);
            return { data: null, error: 'Update error' };
          }
        }
      };
    },
    
    delete: () => {
      return {
        eq: async (column: string, value: any) => {
          try {
            let deleted = false;
            
            Object.keys(localDb[currentTable]).forEach(key => {
              const initialLength = localDb[currentTable][key].length;
              localDb[currentTable][key] = localDb[currentTable][key].filter(item => item[column] !== value);
              if (localDb[currentTable][key].length < initialLength) {
                deleted = true;
              }
            });
            
            persistDb();
            
            return { data: deleted ? { success: true } : null, error: null };
          } catch (error) {
            console.error('Error deleting data:', error);
            return { data: null, error: 'Delete error' };
          }
        }
      };
    },
    
    upsert: (data: any, options: { onConflict?: string } = {}) => {
      return {
        select: async () => {
          const dataArray = Array.isArray(data) ? data : [data];
          const results: any[] = [];
          
          for (const item of dataArray) {
            const id = item.id || `id-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            
            // Check if item exists with this id
            let found = false;
            
            if (options.onConflict) {
              // Look for conflicts based on specified column
              Object.keys(localDb[currentTable]).forEach(key => {
                localDb[currentTable][key].forEach((existingItem, index) => {
                  if (existingItem[options.onConflict!] === item[options.onConflict!]) {
                    found = true;
                    localDb[currentTable][key][index] = { ...existingItem, ...item };
                    results.push(localDb[currentTable][key][index]);
                  }
                });
              });
            }
            
            // If no conflict found, insert as new
            if (!found) {
              if (!localDb[currentTable][id]) {
                localDb[currentTable][id] = [];
              }
              const newItem = { ...item, id };
              localDb[currentTable][id].push(newItem);
              results.push(newItem);
            }
          }
          
          persistDb();
          
          return { data: results, error: null };
        }
      };
    }
  };
  
  return builder;
};

// Supabase client replacement
export const localStorageClient = {
  from: (tableName: string) => createQueryBuilder(tableName),
  auth,
  functions
};

// Channel subscription mock
const createChannel = (channelName: string) => {
  return {
    on: (eventType: string, config: any, callback: Function) => {
      console.log(`Mock channel subscription: ${channelName}, event: ${eventType}`, config);
      return { subscribe: () => console.log(`Subscribed to ${channelName}`) };
    },
    subscribe: () => console.log(`Subscribed to ${channelName}`)
  };
};

// Mock implementation of Supabase
export const supabase = {
  from: (tableName: string) => createQueryBuilder(tableName),
  auth,
  functions,
  channel: (channelName: string) => createChannel(channelName),
  removeChannel: () => {}
};

// Export types for TypeScript compatibility
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface StorageBackup {
  id: string;
  key: string;
  value: Json;
  user_id: string;
  storage_type: string;
  created_at: string;
  updated_at: string;
}

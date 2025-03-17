
// Mock Supabase client using localStorage
class LocalStorageClient {
  private getStorageKey(table: string, id?: string) {
    return id ? `${table}_${id}` : table;
  }

  auth = {
    getUser: async () => {
      const user = localStorage.getItem('current_user');
      return {
        data: {
          user: user ? JSON.parse(user) : { id: 'demo-user-id', email: 'demo@example.com' }
        },
        error: null
      };
    },
    signOut: async () => {
      localStorage.removeItem('current_user');
      return { error: null };
    }
  };

  from(table: string) {
    return {
      select: (fields = '*') => {
        return {
          eq: (column: string, value: any) => {
            return {
              single: () => {
                const items = JSON.parse(localStorage.getItem(this.getStorageKey(table)) || '[]');
                const item = items.find((item: any) => item[column] === value);
                return Promise.resolve({ data: item || null, error: null });
              },
              execute: () => {
                const items = JSON.parse(localStorage.getItem(this.getStorageKey(table)) || '[]');
                const filteredItems = items.filter((item: any) => item[column] === value);
                return Promise.resolve({ data: filteredItems, error: null });
              },
              order: (orderColumn: string, options = { ascending: true }) => {
                return {
                  execute: () => {
                    const items = JSON.parse(localStorage.getItem(this.getStorageKey(table)) || '[]');
                    const filteredItems = items.filter((item: any) => item[column] === value);
                    const sortedItems = filteredItems.sort((a: any, b: any) => {
                      if (options.ascending) {
                        return a[orderColumn] > b[orderColumn] ? 1 : -1;
                      } else {
                        return a[orderColumn] < b[orderColumn] ? 1 : -1;
                      }
                    });
                    return Promise.resolve({ data: sortedItems, error: null });
                  }
                };
              }
            };
          },
          single: () => {
            const items = JSON.parse(localStorage.getItem(this.getStorageKey(table)) || '[]');
            return Promise.resolve({ data: items.length > 0 ? items[0] : null, error: null });
          },
          execute: () => {
            const items = JSON.parse(localStorage.getItem(this.getStorageKey(table)) || '[]');
            return Promise.resolve({ data: items, error: null });
          },
          order: (column: string, options = { ascending: true }) => {
            return {
              execute: () => {
                const items = JSON.parse(localStorage.getItem(this.getStorageKey(table)) || '[]');
                const sortedItems = [...items].sort((a: any, b: any) => {
                  if (options.ascending) {
                    return a[column] > b[column] ? 1 : -1;
                  } else {
                    return a[column] < b[column] ? 1 : -1;
                  }
                });
                return Promise.resolve({ data: sortedItems, error: null });
              }
            };
          }
        };
      },
      insert: (data: any) => {
        const items = JSON.parse(localStorage.getItem(this.getStorageKey(table)) || '[]');
        const newItem = Array.isArray(data) ? data : [data];
        const updatedItems = [...items, ...newItem];
        localStorage.setItem(this.getStorageKey(table), JSON.stringify(updatedItems));
        return Promise.resolve({ data: newItem, error: null });
      },
      update: (data: any) => {
        return {
          eq: (column: string, value: any) => {
            const items = JSON.parse(localStorage.getItem(this.getStorageKey(table)) || '[]');
            const updatedItems = items.map((item: any) => 
              item[column] === value ? { ...item, ...data } : item
            );
            localStorage.setItem(this.getStorageKey(table), JSON.stringify(updatedItems));
            return Promise.resolve({ 
              data: updatedItems.filter((item: any) => item[column] === value), 
              error: null 
            });
          },
          match: (criteria: any) => {
            const items = JSON.parse(localStorage.getItem(this.getStorageKey(table)) || '[]');
            const updatedItems = items.map((item: any) => {
              let matches = true;
              for (const key in criteria) {
                if (item[key] !== criteria[key]) {
                  matches = false;
                  break;
                }
              }
              return matches ? { ...item, ...data } : item;
            });
            localStorage.setItem(this.getStorageKey(table), JSON.stringify(updatedItems));
            return Promise.resolve({ data: updatedItems, error: null });
          }
        };
      },
      delete: () => {
        return {
          eq: (column: string, value: any) => {
            const items = JSON.parse(localStorage.getItem(this.getStorageKey(table)) || '[]');
            const remainingItems = items.filter((item: any) => item[column] !== value);
            localStorage.setItem(this.getStorageKey(table), JSON.stringify(remainingItems));
            return Promise.resolve({ data: null, error: null });
          },
          match: (criteria: any) => {
            const items = JSON.parse(localStorage.getItem(this.getStorageKey(table)) || '[]');
            const remainingItems = items.filter((item: any) => {
              let matches = true;
              for (const key in criteria) {
                if (item[key] !== criteria[key]) {
                  matches = false;
                  break;
                }
              }
              return !matches;
            });
            localStorage.setItem(this.getStorageKey(table), JSON.stringify(remainingItems));
            return Promise.resolve({ data: null, error: null });
          }
        };
      }
    };
  }

  functions = {
    invoke: async (name: string, options?: { body?: any }) => {
      console.log(`Mock function invocation: ${name}`, options?.body);
      
      // Mock responses for different functions
      if (name === 'analyze-productivity') {
        return {
          data: {
            summary: "You've been maintaining consistent productivity.",
            patterns: ["Most productive in the morning", "Frequent breaks in afternoon"],
            recommendations: ["Schedule complex tasks in the morning", "Use Pomodoro technique"],
            alerts: [],
            domainSpecificTips: { "github.com": "Consider timeboxing your coding sessions" },
            productivityByDomain: [
              { domain: "github.com", score: 85 },
              { domain: "docs.google.com", score: 75 }
            ],
            goalProgress: [
              { category: "Development", current: 12, target: 15 },
              { category: "Learning", current: 5, target: 10 }
            ]
          }
        };
      }
      
      return { data: { result: "Function executed" }, error: null };
    }
  };
}

export const localStorageClient = new LocalStorageClient();

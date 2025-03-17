
// Mock implementation of Supabase client using localStorage
import { v4 as uuidv4 } from 'uuid';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// LocalStorageClient mimics supabase client interface but uses localStorage
export class LocalStorageClient {
  constructor() {
    // Initialize storage if needed
  }

  // Mock auth interface
  auth = {
    getUser: async () => {
      return {
        data: {
          user: {
            id: 'demo-user-id',
            email: 'demo@example.com',
          }
        },
        error: null
      };
    },
    signIn: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  };

  // Mock functions interface
  functions = {
    invoke: async (functionName: string, options: any = {}) => {
      console.log(`Mock function invoke: ${functionName}`, options);
      
      if (functionName === 'analyze-productivity') {
        return {
          data: {
            insights: {
              summary: "You've had a productive week with focus on development tasks.",
              patterns: ["Higher productivity in the morning", "Frequent context switching"],
              recommendations: ["Schedule complex tasks in the morning", "Use time blocking"],
              alerts: ["High distraction levels on Wednesday"],
              domainSpecificTips: {
                "example.com": "Consider limiting time on this domain to improve focus."
              },
              productivityByDomain: [
                { domain: "github.com", score: 85 },
                { domain: "docs.google.com", score: 70 },
                { domain: "twitter.com", score: 30 }
              ],
              goalProgress: [
                { category: "Development", current: 12, target: 20 },
                { category: "Learning", current: 5, target: 10 },
                { category: "Research", current: 8, target: 8 }
              ]
            }
          },
          error: null
        };
      }
      
      return { data: { result: '{}' }, error: null };
    }
  };

  // Mock storage interface
  storage = {
    from: (bucket: string) => ({
      upload: async (path: string, file: any) => ({ data: { path }, error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: `https://example.com/${bucket}/${path}` } }),
    })
  };

  // Channel subscription system
  channel(channelName: string) {
    return {
      on: (event: string, callback: Function) => {
        return this;
      },
      subscribe: (callback: Function = () => {}) => {
        // Return an object that mimics the RealtimeChannel interface
        return Promise.resolve({
          unsubscribe: () => {}
        });
      }
    };
  }

  // Remove a channel subscription
  removeChannel(channel: any) {
    // No-op in mock implementation
  }

  // Mock database interface
  from(table: string) {
    return {
      select: (fields?: string) => {
        return {
          eq: (column: string, value: any) => {
            return {
              eq: (col: string, val: any) => this.from(table).select().eq(col, val),
              order: (orderColumn: string, options?: { ascending?: boolean }) => {
                return {
                  execute: async () => {
                    // Return mock data
                    return { data: [], error: null };
                  },
                  data: null,
                  error: null
                };
              },
              single: async () => {
                // Return mock data
                return { data: null, error: null };
              },
              singlePromise: async () => {
                // Return mock data
                return { data: null, error: null };
              },
              data: null,
              error: null
            };
          },
          order: (orderColumn: string, options?: { ascending?: boolean }) => {
            return {
              execute: async () => {
                // Return mock data
                return { data: [], error: null };
              },
              data: null,
              error: null
            };
          },
          single: async () => {
            // Return mock data
            return { data: null, error: null };
          },
          singlePromise: async () => {
            // Return mock data
            return { data: null, error: null };
          },
          execute: async () => {
            // Return mock data for various tables
            return { data: [], error: null };
          },
          data: null,
          error: null
        };
      },
      insert: (data: any) => {
        return {
          select: (fields?: string) => ({
            single: async () => ({ data: { ...data, id: uuidv4() }, error: null }),
            execute: async () => ({ data: [{ ...data, id: uuidv4() }], error: null }),
          }),
          single: async () => ({ data: { ...data, id: uuidv4() }, error: null }),
          execute: async () => ({ data: { ...data, id: uuidv4() }, error: null }),
        };
      },
      update: (data: any) => {
        return {
          eq: (column: string, value: any) => ({
            select: (fields?: string) => ({
              single: async () => ({ data, error: null }),
              execute: async () => ({ data: [data], error: null }),
            }),
            single: async () => ({ data, error: null }),
            execute: async () => ({ data, error: null }),
          })
        };
      },
      upsert: (data: any, options?: { onConflict?: string }) => {
        return {
          select: (fields?: string) => ({
            single: async () => ({ data: { ...data, id: data.id || uuidv4() }, error: null }),
            execute: async () => ({ data: [{ ...data, id: data.id || uuidv4() }], error: null }),
          }),
          single: async () => ({ data: { ...data, id: data.id || uuidv4() }, error: null }),
          execute: async () => ({ data: { ...data, id: data.id || uuidv4() }, error: null }),
        };
      },
      delete: () => {
        return {
          eq: (column: string, value: any) => ({
            select: (fields?: string) => ({
              single: async () => ({ data: null, error: null }),
              execute: async () => ({ data: null, error: null }),
            }),
            single: async () => ({ data: null, error: null }),
            execute: async () => ({ data: null, error: null }),
          })
        };
      },
      eq: (column: string, value: any) => {
        return {
          eq: (col: string, val: any) => this.from(table).eq(col, val),
          order: (orderColumn: string, options?: { ascending?: boolean }) => {
            return {
              execute: async () => {
                // Return mock data
                return { data: [], error: null };
              },
              data: null,
              error: null
            };
          },
          select: (fields?: string) => ({
            single: async () => ({ data: null, error: null }),
            execute: async () => ({ data: [], error: null }),
          }),
          single: async () => ({ data: null, error: null }),
          singlePromise: async () => ({ data: null, error: null }),
          execute: async () => ({ data: [], error: null }),
          data: null,
          error: null
        };
      },
    };
  }
}

// Create a single instance to use throughout the app
export const localStorageClient = new LocalStorageClient();


import { DbResponse, DbListResponse, DbQueryResult, DbSingleResult, DbInsertResult } from './json-types';

// This is a mock implementation of Supabase client for local storage
// It provides the necessary methods to mimic Supabase behavior

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

class LocalStorageClient {
  auth = {
    getUser: async () => ({ data: { user: { id: 'demo-user-id' } } }),
    signIn: async () => ({ data: {}, error: null }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: {}, error: null })
  };

  from(table: string) {
    return {
      select: (fields?: string): DbQueryResult<any> => {
        return {
          execute: () => Promise.resolve({ data: [], error: null }),
        };
      },
      
      insert: (data: any): DbInsertResult<any> => {
        return {
          single: () => Promise.resolve({ data: {}, error: null }),
          select: () => Promise.resolve({ data: [{}], error: null })
        };
      },
      
      update: (data: any): DbSingleResult<any> => {
        return {
          eq: (column: string, value: any) => {
            return {
              single: () => Promise.resolve({ data: {}, error: null }),
              execute: () => Promise.resolve({ data: {}, error: null })
            };
          },
          single: () => Promise.resolve({ data: {}, error: null }),
          execute: () => Promise.resolve({ data: {}, error: null })
        };
      },
      
      delete: () => {
        return {
          eq: (column: string, value: any) => {
            return {
              execute: () => Promise.resolve({ data: {}, error: null })
            };
          }
        };
      },
      
      upsert: (data: any) => {
        return Promise.resolve({ data: {}, error: null });
      },
      
      eq: (column: string, value: any) => {
        return {
          single: () => Promise.resolve({ data: {}, error: null }),
          execute: () => Promise.resolve({ data: [], error: null }),
          order: (orderColumn: string, options?: { ascending: boolean }) => {
            return { 
              execute: () => Promise.resolve({ data: [], error: null }) 
            };
          }
        };
      },
      
      order: (column: string, options?: { ascending: boolean }) => {
        return { 
          execute: () => Promise.resolve({ data: [], error: null }) 
        };
      }
    };
  }

  // Add realtime subscription methods
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

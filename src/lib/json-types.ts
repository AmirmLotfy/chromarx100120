
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Define expected DB types to match the conversationService

export interface DbResponse<T> {
  data: T;
  error: any;
}

export interface DbListResponse<T> {
  data: T[];
  error: any;
}

export interface DbQueryResult<T> {
  eq: (column: string, value: any) => DbQueryResult<T>;
  order: (column: string, options?: { ascending: boolean }) => DbQueryResult<T>;
  execute: () => Promise<DbListResponse<T>>;
  data: T[];
  error: any;
}

export interface DbSingleResult<T> {
  eq: (column: string, value: any) => DbSingleResult<T>;
  select: () => Promise<DbListResponse<T>>;
  execute: () => Promise<DbResponse<T>>;
  error: any;
}

export interface DbInsertResult<T> {
  single: () => Promise<DbResponse<T>>;
  select: () => Promise<DbListResponse<T>>;
  execute: () => Promise<DbListResponse<T>>;
  error: any;
}


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
  execute: () => Promise<DbListResponse<T>>;
}

export interface DbSingleResult<T> {
  single: () => Promise<DbResponse<T>>;
  execute: () => Promise<DbResponse<T>>;
}

export interface DbInsertResult<T> {
  single: () => Promise<DbResponse<T>>;
  select: () => Promise<DbListResponse<T>>;
}


export interface QueryResult<T> {
  data: T[] | null;
  error: Error | null;
}

export interface QueryBuilder<T> {
  select(): QueryBuilder<T>;
  eq(column: string, value: any): QueryBuilder<T>;
  order(column: string, options?: { ascending: boolean }): QueryBuilder<T>;
  delete(): QueryBuilder<T>;
  insert(data: T | T[]): QueryBuilder<T>;
  update(data: Partial<T>): QueryBuilder<T>;
  from: (table: string) => QueryBuilder<T>;
  execute(): Promise<QueryResult<T>>;
}

export interface ChromeStorageClientInterface {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<boolean>;
  remove(key: string): Promise<boolean>;
  from<T>(tableName: string): QueryBuilder<T>;
  auth: {
    getUser(): Promise<{ data: { user: any } | null, error: Error | null }>;
  };
}

export type SqlParam = string | number | null;

export type Row = Record<string, SqlParam>;

/**
 * Minimal synchronous-style database interface shared by the SQLite WASM
 * production client (SqliteWasmDbClient) and the in-memory test fake.
 *
 * All repository code is written against this interface so it can run in
 * both the browser and Node.js test environments.
 */
export interface DbClient {
  /** Execute one or more statements with no return value (DDL, INSERT, UPDATE, DELETE). */
  run(sql: string, params?: SqlParam[]): void;

  /** Return all matching rows as plain objects. */
  all<T extends Row>(sql: string, params?: SqlParam[]): T[];

  /** Return the first matching row, or undefined. */
  get<T extends Row>(sql: string, params?: SqlParam[]): T | undefined;

  close(): void;
}

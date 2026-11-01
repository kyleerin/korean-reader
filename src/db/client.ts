export type SqlParam = string | number | null;

export type Row = Record<string, SqlParam>;

/**
 * EXPERIMENTAL — not used by the production App.
 * Production persistence is localStorage (knowledge + review) and in-memory
 * ndjson for the dictionary. This interface backs the unused SQLite/OPFS path
 * kept for a future text-history / token_cache migration.
 *
 * Minimal synchronous-style database interface shared by the SQLite WASM
 * client (SqliteWasmDbClient) and the in-memory test fake.
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

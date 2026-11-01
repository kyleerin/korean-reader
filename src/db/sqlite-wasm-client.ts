import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
import { SCHEMA_SQL } from './schema';
import type { DbClient, Row, SqlParam } from './client';

/**
 * EXPERIMENTAL — not wired into App. Production uses localStorage + ndjson.
 *
 * DbClient backed by @sqlite.org/sqlite-wasm.
 * In the browser, pass a path inside OPFS for persistence.
 * Pass ':memory:' for an in-memory database (used in tests).
 */
export class SqliteWasmDbClient implements DbClient {
  private constructor(private readonly db: Sqlite3Db) {}

  static async open(path: ':memory:' | string): Promise<SqliteWasmDbClient> {
    // @ts-expect-error — library types omit the optional config arg
    const sqlite3 = await sqlite3InitModule({ print: () => {}, printErr: () => {} });
    const db = new sqlite3.oo1.DB(path, 'ct') as Sqlite3Db;
    const client = new SqliteWasmDbClient(db);
    client.run(SCHEMA_SQL);
    return client;
  }

  run(sql: string, params: SqlParam[] = []): void {
    this.db.exec({ sql, bind: params as BindingSpec });
  }

  all<T extends Row>(sql: string, params: SqlParam[] = []): T[] {
    return this.db.exec({
      sql,
      bind: params as BindingSpec,
      returnValue: 'resultRows',
      rowMode: 'object',
    }) as T[];
  }

  get<T extends Row>(sql: string, params: SqlParam[] = []): T | undefined {
    return this.all<T>(sql, params)[0];
  }

  close(): void {
    this.db.close();
  }
}

// ── Minimal local types for the oo1.DB API ───────────────────────────────────
// The @sqlite.org/sqlite-wasm package ships its own complex types; these
// cover only what SqliteWasmDbClient uses.

type BindingSpec = (string | number | null)[];

interface ExecOptions {
  sql: string;
  bind?: BindingSpec;
  rowMode?: 'object' | 'array';
  returnValue?: 'this' | 'resultRows';
}

interface Sqlite3Db {
  exec(sql: string): this;
  exec(opts: ExecOptions & { returnValue: 'resultRows' }): unknown[];
  exec(opts: ExecOptions): this;
  close(): void;
}

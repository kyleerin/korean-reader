import type { DbClient, Row, SqlParam } from '../../src/db/client';

/**
 * Minimal in-memory DbClient for testing repository logic without SQLite WASM.
 *
 * Implements only the SQL patterns used by the repositories — not a general
 * SQL engine. Each table is a simple Map of rows keyed by primary key string.
 */
export class InMemoryDbClient implements DbClient {
  private tables = new Map<string, Map<string, Row>>();

  /** Pre-populate a table row (useful for seeding test data). */
  seed(table: string, key: string, row: Row): void {
    if (!this.tables.has(table)) this.tables.set(table, new Map());
    this.tables.get(table)!.set(key, row);
  }

  private tableRows(name: string): Map<string, Row> {
    if (!this.tables.has(name)) this.tables.set(name, new Map());
    return this.tables.get(name)!;
  }

  run(sql: string, params: SqlParam[] = []): void {
    const s = sql.trim().toUpperCase();
    if (s.startsWith('BEGIN') || s.startsWith('COMMIT') || s.startsWith('ROLLBACK') ||
        s.startsWith('CREATE') || s.startsWith('INSERT INTO dictionary') ||
        s.startsWith('INSERT OR IGNORE')) {
      this.handleInsert(sql, params);
      return;
    }
    this.handleUpsert(sql, params);
  }

  private handleInsert(sql: string, params: SqlParam[]): void {
    const tableMatch = /(?:INTO|IGNORE INTO)\s+(\w+)/i.exec(sql);
    const colMatch = /\(([^)]+)\)\s+VALUES/i.exec(sql);
    if (!tableMatch || !colMatch) return;
    const table = tableMatch[1]!;
    const cols = colMatch[1]!.split(',').map(c => c.trim());
    const row: Row = {};
    cols.forEach((col, i) => { row[col] = params[i] ?? null; });

    const rows = this.tableRows(table);
    const pk = this.buildPk(table, row);
    const isIgnore = /INSERT OR IGNORE/i.test(sql);
    if (isIgnore && rows.has(pk)) return;
    rows.set(pk, { ...rows.get(pk), ...row });
  }

  private handleUpsert(sql: string, params: SqlParam[]): void {
    // Handles the ON CONFLICT upsert patterns used by SqliteKnowledgeRepository
    const tableMatch = /INTO\s+(\w+)/i.exec(sql);
    if (!tableMatch) return;
    const table = tableMatch[1]!;
    const colMatch = /\(([^)]+)\)\s+VALUES/i.exec(sql);
    if (!colMatch) return;
    const cols = colMatch[1]!.split(',').map(c => c.trim());
    const row: Row = {};
    cols.forEach((col, i) => { row[col] = params[i] ?? null; });
    const pk = this.buildPk(table, row);
    const rows = this.tableRows(table);
    const existing = rows.get(pk);

    // Extract SET clause after DO UPDATE SET
    const setMatch = /DO UPDATE SET\s+([\s\S]+)/i.exec(sql);
    if (setMatch && existing) {
      const updates = parseSetClause(setMatch[1]!, row, existing);
      rows.set(pk, { ...existing, ...updates });
    } else {
      rows.set(pk, row);
    }
  }

  all<T extends Row>(sql: string, params: SqlParam[] = []): T[] {
    const tableMatch = /FROM\s+(\w+)/i.exec(sql);
    if (!tableMatch) return [];
    const table = tableMatch[1]!;
    const rows = [...this.tableRows(table).values()];

    const whereMatch = /WHERE\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/is.exec(sql);
    if (!whereMatch) return rows as T[];

    const conditions = parseWhere(whereMatch[1]!, params);
    return rows.filter(row => conditions.every(([col, val]) => row[col] === val)) as T[];
  }

  get<T extends Row>(sql: string, params: SqlParam[] = []): T | undefined {
    return this.all<T>(sql, params)[0];
  }

  close(): void {
    this.tables.clear();
  }

  private buildPk(table: string, row: Row): string {
    if (table === 'dictionary_entry' || table === 'user_word_state') {
      return `${row['lemma']}\x00${row['pos']}`;
    }
    return String(row['id'] ?? JSON.stringify(row));
  }
}

function parseWhere(clause: string, params: SqlParam[]): [string, SqlParam][] {
  let i = 0;
  return clause.split(/\s+AND\s+/i).map(part => {
    const m = /(\w+)\s*=\s*\?/.exec(part);
    return [m ? m[1]! : '', params[i++] ?? null] as [string, SqlParam];
  }).filter(([col]) => col.length > 0);
}

function parseSetClause(clause: string, incoming: Row, existing: Row): Row {
  const result: Row = {};
  for (const part of clause.split(',')) {
    const m = /(\w+)\s*=\s*(.+)/.exec(part.trim());
    if (!m) continue;
    const [, col, expr] = m as unknown as [string, string, string];
    const e = expr.trim();
    if (e === 'excluded.' + col) {
      result[col] = incoming[col] ?? null;
    } else if (/times_seen\s*\+\s*1/.test(e)) {
      result[col] = ((existing[col] as number) ?? 0) + 1;
    } else {
      result[col] = incoming[col] ?? null;
    }
  }
  return result;
}

import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
}

export interface UserStore {
  findByEmail(email: string): UserRecord | undefined;
  findById(id: string): UserRecord | undefined;
  create(user: UserRecord): void;
}

export class SqliteUserStore implements UserStore {
  private readonly db: Database.Database;

  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true });
    this.db = new Database(path);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  }

  findByEmail(email: string): UserRecord | undefined {
    return this.db.prepare(
      'SELECT id, email, name, password_hash, created_at FROM users WHERE email = ?',
    ).get(email) as UserRecord | undefined;
  }

  findById(id: string): UserRecord | undefined {
    return this.db.prepare(
      'SELECT id, email, name, password_hash, created_at FROM users WHERE id = ?',
    ).get(id) as UserRecord | undefined;
  }

  create(user: UserRecord): void {
    this.db.prepare(
      'INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run(user.id, user.email, user.name, user.password_hash, user.created_at);
  }

  close(): void {
    this.db.close();
  }
}

export class InMemoryUserStore implements UserStore {
  private readonly users = new Map<string, UserRecord>();

  findByEmail(email: string): UserRecord | undefined {
    return [...this.users.values()].find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findById(id: string): UserRecord | undefined {
    return this.users.get(id);
  }

  create(user: UserRecord): void {
    if (this.findByEmail(user.email)) {
      throw new Error('UNIQUE email');
    }
    this.users.set(user.id, user);
  }
}

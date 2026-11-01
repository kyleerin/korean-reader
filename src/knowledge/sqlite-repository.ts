import type { DbClient } from '../db/client';
import type { KnowledgeState, PartOfSpeech } from '../domain/model';
import type { KnowledgeRepository, KnowledgeWord } from './repository';

export class SqliteKnowledgeRepository implements KnowledgeRepository {
  private readonly listeners = new Map<string, Set<(s: KnowledgeState) => void>>();

  constructor(private readonly db: DbClient) {}

  async listWords(): Promise<KnowledgeWord[]> {
    return this.db.all<{ lemma: string; pos: PartOfSpeech; status: KnowledgeState }>(
      'SELECT lemma, pos, status FROM user_word_state',
    ).map(row => ({ lemma: row.lemma, pos: row.pos, state: row.status }));
  }

  async getState(lemma: string, pos: PartOfSpeech): Promise<KnowledgeState> {
    const row = this.db.get<{ status: string }>(
      'SELECT status FROM user_word_state WHERE lemma = ? AND pos = ?',
      [lemma, pos],
    );
    return (row?.status as KnowledgeState) ?? 'NEW';
  }

  async setState(lemma: string, pos: PartOfSpeech, state: KnowledgeState): Promise<void> {
    const now = Date.now();
    this.db.run(
      `INSERT INTO user_word_state (lemma, pos, status, first_seen, last_seen, times_seen)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(lemma, pos) DO UPDATE SET
         status    = excluded.status,
         last_seen = excluded.last_seen`,
      [lemma, pos, state, now, now, 1],
    );
    this.notify(lemma, pos, state);
  }

  async recordSeen(lemma: string, pos: PartOfSpeech): Promise<void> {
    const now = Date.now();
    this.db.run(
      `INSERT INTO user_word_state (lemma, pos, status, first_seen, last_seen, times_seen)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(lemma, pos) DO UPDATE SET
         last_seen  = excluded.last_seen,
         times_seen = times_seen + 1`,
      [lemma, pos, 'NEW', now, now, 1],
    );
  }

  observeState(lemma: string, pos: PartOfSpeech, callback: (state: KnowledgeState) => void): () => void {
    const key = `${lemma}\x00${pos}`;
    if (!this.listeners.has(key)) this.listeners.set(key, new Set());
    this.listeners.get(key)!.add(callback);
    return () => this.listeners.get(key)?.delete(callback);
  }

  private notify(lemma: string, pos: PartOfSpeech, state: KnowledgeState): void {
    this.listeners.get(`${lemma}\x00${pos}`)?.forEach(cb => cb(state));
  }
}

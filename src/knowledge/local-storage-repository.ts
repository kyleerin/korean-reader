import type { KnowledgeState, PartOfSpeech } from '../domain/model';
import type { KnowledgeRepository } from './repository';

const LS_KEY = 'korean-reader:knowledge';

export class LocalStorageKnowledgeRepository implements KnowledgeRepository {
  private readonly store: Map<string, KnowledgeState>;
  private readonly listeners = new Map<string, Set<(s: KnowledgeState) => void>>();

  constructor() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      this.store = raw ? new Map(JSON.parse(raw) as [string, KnowledgeState][]) : new Map();
    } catch {
      this.store = new Map();
    }
  }

  private key(lemma: string, pos: PartOfSpeech): string {
    return `${lemma}\x00${pos}`;
  }

  private persist(): void {
    localStorage.setItem(LS_KEY, JSON.stringify([...this.store]));
  }

  async getState(lemma: string, pos: PartOfSpeech): Promise<KnowledgeState> {
    return this.store.get(this.key(lemma, pos)) ?? 'NEW';
  }

  async setState(lemma: string, pos: PartOfSpeech, state: KnowledgeState): Promise<void> {
    this.store.set(this.key(lemma, pos), state);
    this.persist();
    this.listeners.get(this.key(lemma, pos))?.forEach(cb => cb(state));
  }

  async recordSeen(_lemma: string, _pos: PartOfSpeech): Promise<void> {
    // localStorage version: no-op (times_seen not tracked here)
  }

  observeState(lemma: string, pos: PartOfSpeech, callback: (state: KnowledgeState) => void): () => void {
    const k = this.key(lemma, pos);
    if (!this.listeners.has(k)) this.listeners.set(k, new Set());
    this.listeners.get(k)!.add(callback);
    return () => this.listeners.get(k)?.delete(callback);
  }
}

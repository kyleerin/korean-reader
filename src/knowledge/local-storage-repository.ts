import type { KnowledgeState, PartOfSpeech } from '../domain/model';
import type { KnowledgeRepository, KnowledgeWord } from './repository';

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

  async listWords(): Promise<KnowledgeWord[]> {
    return [...this.store].map(([key, state]) => {
      const [lemma, pos] = key.split('\x00') as [string, PartOfSpeech];
      return { lemma, pos, state };
    });
  }

  async getState(lemma: string, pos: PartOfSpeech): Promise<KnowledgeState> {
    return this.store.get(this.key(lemma, pos)) ?? 'NEW';
  }

  async setState(lemma: string, pos: PartOfSpeech, state: KnowledgeState): Promise<void> {
    this.store.set(this.key(lemma, pos), state);
    this.persist();
    this.listeners.get(this.key(lemma, pos))?.forEach(cb => cb(state));
  }

  async recordSeen(lemma: string, pos: PartOfSpeech): Promise<void> {
    const key = this.key(lemma, pos);
    if (this.store.has(key)) return;
    this.store.set(key, 'NEW');
    this.persist();
  }

  observeState(lemma: string, pos: PartOfSpeech, callback: (state: KnowledgeState) => void): () => void {
    const k = this.key(lemma, pos);
    if (!this.listeners.has(k)) this.listeners.set(k, new Set());
    this.listeners.get(k)!.add(callback);
    return () => this.listeners.get(k)?.delete(callback);
  }
}

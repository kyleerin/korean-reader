import type { KnowledgeRepository } from '../../src/knowledge/repository';
import type { KnowledgeState, PartOfSpeech } from '../../src/domain/model';

export class InMemoryKnowledgeRepository implements KnowledgeRepository {
  private readonly states = new Map<string, KnowledgeState>();
  private readonly listeners = new Map<string, Set<(s: KnowledgeState) => void>>();

  private key(lemma: string, pos: PartOfSpeech): string {
    return lemma + '\x00' + pos;
  }

  async getState(lemma: string, pos: PartOfSpeech): Promise<KnowledgeState> {
    return this.states.get(this.key(lemma, pos)) ?? 'NEW';
  }

  async setState(lemma: string, pos: PartOfSpeech, state: KnowledgeState): Promise<void> {
    const k = this.key(lemma, pos);
    this.states.set(k, state);
    this.listeners.get(k)?.forEach(cb => cb(state));
  }

  async recordSeen(lemma: string, pos: PartOfSpeech): Promise<void> {
    const k = this.key(lemma, pos);
    if (!this.states.has(k)) this.states.set(k, 'NEW');
  }

  observeState(lemma: string, pos: PartOfSpeech, callback: (state: KnowledgeState) => void): () => void {
    const k = this.key(lemma, pos);
    if (!this.listeners.has(k)) this.listeners.set(k, new Set());
    this.listeners.get(k)!.add(callback);
    return () => this.listeners.get(k)?.delete(callback);
  }
}

import type { KnowledgeState, PartOfSpeech } from '../domain/model';

export interface KnowledgeRepository {
  /** Returns the current state, defaulting to NEW for unseen words. */
  getState(lemma: string, pos: PartOfSpeech): Promise<KnowledgeState>;

  /** Persists a state change. */
  setState(lemma: string, pos: PartOfSpeech, state: KnowledgeState): Promise<void>;

  /** Records a sighting without changing status (increments times_seen). */
  recordSeen(lemma: string, pos: PartOfSpeech): Promise<void>;

  /**
   * Subscribe to state changes for a single word.
   * Returns an unsubscribe function — call it to stop receiving updates.
   * Used for live recoloring when the user marks a word mid-reading.
   */
  observeState(lemma: string, pos: PartOfSpeech, callback: (state: KnowledgeState) => void): () => void;
}

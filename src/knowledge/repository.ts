import type { KnowledgeState, PartOfSpeech } from '../domain/model';

export interface KnowledgeWord {
  readonly lemma: string;
  readonly pos: PartOfSpeech;
  readonly state: KnowledgeState;
}

export interface KnowledgeRepository {
  /** Lists saved vocabulary, including encountered words still marked NEW. */
  listWords(): Promise<KnowledgeWord[]>;

  /** Returns the current state, defaulting to NEW for unseen words. */
  getState(lemma: string, pos: PartOfSpeech): Promise<KnowledgeState>;

  /** Persists a state change. */
  setState(lemma: string, pos: PartOfSpeech, state: KnowledgeState): Promise<void>;

  /**
   * Records that a lemma was encountered in a text.
   * Inserts NEW when unseen; leaves an existing state unchanged.
   * (times_seen counters are deferred until OPFS persistence.)
   */
  recordSeen(lemma: string, pos: PartOfSpeech): Promise<void>;

  /**
   * Subscribe to state changes for a single word.
   * Returns an unsubscribe function — call it to stop receiving updates.
   * Used for live recoloring when the user marks a word mid-reading.
   */
  observeState(lemma: string, pos: PartOfSpeech, callback: (state: KnowledgeState) => void): () => void;
}

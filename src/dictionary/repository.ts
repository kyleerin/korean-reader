import type { DictionaryEntry, PartOfSpeech } from '../domain/model';

export interface DictionaryRepository {
  /** Exact lemma + POS match. Returns undefined when not found. */
  lookup(lemma: string, pos: PartOfSpeech): Promise<DictionaryEntry | undefined>;

  /** All entries for a lemma regardless of POS (for homograph display). */
  lookupAll(lemma: string): Promise<DictionaryEntry[]>;
}

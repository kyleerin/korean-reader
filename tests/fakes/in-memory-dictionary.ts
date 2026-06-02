import type { DictionaryRepository } from '../../src/dictionary/repository';
import type { DictionaryEntry, PartOfSpeech } from '../../src/domain/model';

export class InMemoryDictionaryRepository implements DictionaryRepository {
  private readonly entries: Map<string, DictionaryEntry>;

  constructor(entries: [key: [string, PartOfSpeech], entry: DictionaryEntry][] = []) {
    this.entries = new Map(entries.map(([k, v]) => [k[0] + '\x00' + k[1], v]));
  }

  async lookup(lemma: string, pos: PartOfSpeech): Promise<DictionaryEntry | undefined> {
    return this.entries.get(lemma + '\x00' + pos);
  }

  async lookupAll(lemma: string): Promise<DictionaryEntry[]> {
    return [...this.entries.entries()]
      .filter(([k]) => k.startsWith(lemma + '\x00'))
      .map(([, v]) => v);
  }
}

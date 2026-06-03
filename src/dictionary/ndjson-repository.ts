import type { DictionaryEntry, PartOfSpeech } from '../domain/model';
import type { DictionaryRepository } from './repository';
import { parseNdjson } from './loader';

export class NdjsonDictionaryRepository implements DictionaryRepository {
  private readonly byLemmaPos = new Map<string, DictionaryEntry>();
  private readonly byLemma = new Map<string, DictionaryEntry[]>();

  private constructor(entries: DictionaryEntry[]) {
    for (const e of entries) {
      this.byLemmaPos.set(`${e.lemma}\x00${e.pos}`, e);
      const bucket = this.byLemma.get(e.lemma) ?? [];
      bucket.push(e);
      this.byLemma.set(e.lemma, bucket);
    }
  }

  static async load(url = `${import.meta.env.BASE_URL}dictionary.ndjson`): Promise<NdjsonDictionaryRepository> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load dictionary: HTTP ${res.status}`);
    const text = await res.text();
    return new NdjsonDictionaryRepository(parseNdjson(text));
  }

  async lookup(lemma: string, pos: PartOfSpeech): Promise<DictionaryEntry | undefined> {
    return this.byLemmaPos.get(`${lemma}\x00${pos}`);
  }

  async lookupAll(lemma: string): Promise<DictionaryEntry[]> {
    return this.byLemma.get(lemma) ?? [];
  }
}

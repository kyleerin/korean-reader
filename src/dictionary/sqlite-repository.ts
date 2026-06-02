import type { DbClient } from '../db/client';
import type { DictionaryEntry, PartOfSpeech } from '../domain/model';
import type { DictionaryRepository } from './repository';

export class SqliteDictionaryRepository implements DictionaryRepository {
  constructor(private readonly db: DbClient) {}

  async lookup(lemma: string, pos: PartOfSpeech): Promise<DictionaryEntry | undefined> {
    const row = this.db.get<DictRow>(
      'SELECT lemma, pos, definitions, examples, frequency_rank FROM dictionary_entry WHERE lemma = ? AND pos = ?',
      [lemma, pos],
    );
    return row ? rowToEntry(row) : undefined;
  }

  async lookupAll(lemma: string): Promise<DictionaryEntry[]> {
    const rows = this.db.all<DictRow>(
      'SELECT lemma, pos, definitions, examples, frequency_rank FROM dictionary_entry WHERE lemma = ?',
      [lemma],
    );
    return rows.map(rowToEntry);
  }
}

interface DictRow {
  lemma: string;
  pos: string;
  definitions: string;
  examples: string | null;
  frequency_rank: number | null;
}

function rowToEntry(row: DictRow): DictionaryEntry {
  return {
    lemma: row.lemma,
    pos: row.pos as PartOfSpeech,
    definitions: JSON.parse(row.definitions) as string[],
    examples: row.examples ? (JSON.parse(row.examples) as string[]) : undefined,
    frequencyRank: row.frequency_rank ?? undefined,
  };
}

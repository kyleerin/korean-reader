import type { DbClient } from '../db/client';
import type { PartOfSpeech } from '../domain/model';

export interface DictionaryRecord {
  lemma: string;
  pos: PartOfSpeech;
  definitions: string[];
  examples?: string[];
  frequencyRank?: number;
}

/**
 * Bulk-loads dictionary records into the database.
 *
 * Uses a transaction for performance — loading tens of thousands of entries
 * one-by-one without a transaction is extremely slow in SQLite.
 *
 * Safe to call multiple times: INSERT OR IGNORE skips duplicates.
 */
export function loadDictionary(db: DbClient, records: DictionaryRecord[]): void {
  db.run('BEGIN');
  try {
    for (const rec of records) {
      db.run(
        `INSERT OR IGNORE INTO dictionary_entry (lemma, pos, definitions, examples, frequency_rank)
         VALUES (?, ?, ?, ?, ?)`,
        [
          rec.lemma,
          rec.pos,
          JSON.stringify(rec.definitions),
          rec.examples ? JSON.stringify(rec.examples) : null,
          rec.frequencyRank ?? null,
        ],
      );
    }
    db.run('COMMIT');
  } catch (err) {
    db.run('ROLLBACK');
    throw err;
  }
}

/**
 * Parses a newline-delimited JSON file where each line is a DictionaryRecord.
 * This is the expected format for the bundled KO→EN dictionary asset.
 */
export function parseNdjson(ndjson: string): DictionaryRecord[] {
  return ndjson
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => JSON.parse(line) as DictionaryRecord);
}

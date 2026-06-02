import { beforeEach, describe, expect, it } from 'vitest';
import { SqliteDictionaryRepository } from '../../src/dictionary/sqlite-repository';
import { loadDictionary, parseNdjson } from '../../src/dictionary/loader';
import { InMemoryDbClient } from '../fakes/in-memory-db-client';

describe('SqliteDictionaryRepository', () => {
  let db: InMemoryDbClient;
  let repo: SqliteDictionaryRepository;

  beforeEach(() => {
    db = new InMemoryDbClient();
    repo = new SqliteDictionaryRepository(db);

    loadDictionary(db, [
      { lemma: '먹다', pos: 'VV', definitions: ['to eat'], frequencyRank: 12 },
      { lemma: '밥',   pos: 'NN', definitions: ['cooked rice', 'meal'], examples: ['밥을 먹다'] },
      { lemma: '크다', pos: 'VA', definitions: ['to be big', 'to be large'] },
    ]);
  });

  it('looks up a known lemma+pos pair', async () => {
    const entry = await repo.lookup('먹다', 'VV');
    expect(entry).toBeDefined();
    expect(entry!.lemma).toBe('먹다');
    expect(entry!.definitions).toEqual(['to eat']);
  });

  it('returns undefined for an unknown lemma', async () => {
    expect(await repo.lookup('없는단어', 'NN')).toBeUndefined();
  });

  it('returns undefined when pos does not match', async () => {
    expect(await repo.lookup('먹다', 'NN')).toBeUndefined();
  });

  it('includes frequencyRank when present', async () => {
    const entry = await repo.lookup('먹다', 'VV');
    expect(entry!.frequencyRank).toBe(12);
  });

  it('frequencyRank is undefined when absent', async () => {
    const entry = await repo.lookup('밥', 'NN');
    expect(entry!.frequencyRank).toBeUndefined();
  });

  it('includes examples when present', async () => {
    const entry = await repo.lookup('밥', 'NN');
    expect(entry!.examples).toEqual(['밥을 먹다']);
  });

  it('lookupAll returns all entries for a lemma', async () => {
    // 크다 exists only as VA; add a second homograph to test lookupAll
    loadDictionary(db, [{ lemma: '크다', pos: 'VV', definitions: ['(rare verb form)'] }]);
    const entries = await repo.lookupAll('크다');
    expect(entries).toHaveLength(2);
    expect(entries.map(e => e.pos).sort()).toEqual(['VA', 'VV']);
  });

  it('lookupAll returns empty array for unknown lemma', async () => {
    expect(await repo.lookupAll('없는단어')).toHaveLength(0);
  });
});

describe('loadDictionary', () => {
  it('skips duplicates (INSERT OR IGNORE)', async () => {
    const db = new InMemoryDbClient();
    const repo = new SqliteDictionaryRepository(db);
    loadDictionary(db, [{ lemma: '가다', pos: 'VV', definitions: ['to go'] }]);
    loadDictionary(db, [{ lemma: '가다', pos: 'VV', definitions: ['OVERWRITTEN'] }]);
    // Second load ignored — first definition wins
    await expect(repo.lookup('가다', 'VV')).resolves.toMatchObject({ definitions: ['to go'] });
  });
});

describe('parseNdjson', () => {
  it('parses newline-delimited JSON', () => {
    const input = [
      JSON.stringify({ lemma: '가다', pos: 'VV', definitions: ['to go'] }),
      JSON.stringify({ lemma: '오다', pos: 'VV', definitions: ['to come'] }),
    ].join('\n');

    const records = parseNdjson(input);
    expect(records).toHaveLength(2);
    expect(records[0]!.lemma).toBe('가다');
    expect(records[1]!.lemma).toBe('오다');
  });

  it('ignores blank lines', () => {
    const input = `${JSON.stringify({ lemma: '가다', pos: 'VV', definitions: ['to go'] })}\n\n`;
    expect(parseNdjson(input)).toHaveLength(1);
  });
});

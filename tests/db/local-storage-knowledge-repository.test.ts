import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStorageKnowledgeRepository } from '../../src/knowledge/local-storage-repository';
import { createMemoryLocalStorage } from '../fakes/memory-local-storage';

describe('LocalStorageKnowledgeRepository vocabulary', () => {
  beforeEach(() => vi.stubGlobal('localStorage', createMemoryLocalStorage()));
  afterEach(() => vi.unstubAllGlobals());

  it('starts with no saved words and does not save mere state lookups', async () => {
    const repo = new LocalStorageKnowledgeRepository();
    await repo.getState('밥', 'NN');
    expect(await repo.listWords()).toEqual([]);
  });

  it('persists encountered words without duplicating or resetting saved states', async () => {
    const repo = new LocalStorageKnowledgeRepository();
    await repo.setState('먹다', 'VV', 'KNOWN');
    await repo.setState('밥', 'NN', 'LEARNING');
    await repo.recordSeen('먹다', 'VV');
    await repo.recordSeen('밥', 'NN');
    await repo.recordSeen('나', 'NP');
    await repo.recordSeen('나', 'NP');
    expect(await new LocalStorageKnowledgeRepository().listWords()).toEqual([
      { lemma: '먹다', pos: 'VV', state: 'KNOWN' },
      { lemma: '밥', pos: 'NN', state: 'LEARNING' },
      { lemma: '나', pos: 'NP', state: 'NEW' },
    ]);
  });

  it('reads existing saved states and keeps different parts of speech separate', async () => {
    localStorage.setItem('korean-reader:knowledge', JSON.stringify([
      ['눈\x00NN', 'KNOWN'], ['눈\x00NNP', 'IGNORED'],
    ]));
    const repo = new LocalStorageKnowledgeRepository();
    expect(await repo.listWords()).toEqual([
      { lemma: '눈', pos: 'NN', state: 'KNOWN' },
      { lemma: '눈', pos: 'NNP', state: 'IGNORED' },
    ]);
    await repo.setState('눈', 'NN', 'NEW');
    expect((await repo.listWords())[0]!.state).toBe('NEW');
  });
});

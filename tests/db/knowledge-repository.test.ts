import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SqliteKnowledgeRepository } from '../../src/knowledge/sqlite-repository';
import { InMemoryDbClient } from '../fakes/in-memory-db-client';

describe('SqliteKnowledgeRepository', () => {
  let db: InMemoryDbClient;
  let repo: SqliteKnowledgeRepository;

  beforeEach(() => {
    db = new InMemoryDbClient();
    repo = new SqliteKnowledgeRepository(db);
  });

  it('returns NEW for an unseen word', async () => {
    expect(await repo.getState('먹다', 'VV')).toBe('NEW');
  });

  it('persists and retrieves state', async () => {
    await repo.setState('먹다', 'VV', 'KNOWN');
    expect(await repo.getState('먹다', 'VV')).toBe('KNOWN');
  });

  it('updates state on second call', async () => {
    await repo.setState('밥', 'NN', 'LEARNING');
    await repo.setState('밥', 'NN', 'KNOWN');
    expect(await repo.getState('밥', 'NN')).toBe('KNOWN');
  });

  it('states are independent per lemma+pos', async () => {
    await repo.setState('먹다', 'VV', 'KNOWN');
    expect(await repo.getState('밥', 'NN')).toBe('NEW');
  });

  it('recordSeen inserts a NEW entry for a fresh word', async () => {
    await repo.recordSeen('가다', 'VV');
    expect(await repo.getState('가다', 'VV')).toBe('NEW');
  });

  it('recordSeen does not overwrite an existing state', async () => {
    await repo.setState('가다', 'VV', 'LEARNING');
    await repo.recordSeen('가다', 'VV');
    expect(await repo.getState('가다', 'VV')).toBe('LEARNING');
  });

  describe('observeState', () => {
    it('fires callback when state changes', async () => {
      const cb = vi.fn();
      repo.observeState('먹다', 'VV', cb);
      await repo.setState('먹다', 'VV', 'LEARNING');
      expect(cb).toHaveBeenCalledWith('LEARNING');
    });

    it('does not fire after unsubscribe', async () => {
      const cb = vi.fn();
      const unsub = repo.observeState('먹다', 'VV', cb);
      unsub();
      await repo.setState('먹다', 'VV', 'KNOWN');
      expect(cb).not.toHaveBeenCalled();
    });

    it('fires to all active subscribers', async () => {
      const cb1 = vi.fn();
      const cb2 = vi.fn();
      repo.observeState('밥', 'NN', cb1);
      repo.observeState('밥', 'NN', cb2);
      await repo.setState('밥', 'NN', 'IGNORED');
      expect(cb1).toHaveBeenCalledWith('IGNORED');
      expect(cb2).toHaveBeenCalledWith('IGNORED');
    });

    it('does not fire for a different word', async () => {
      const cb = vi.fn();
      repo.observeState('먹다', 'VV', cb);
      await repo.setState('밥', 'NN', 'KNOWN');
      expect(cb).not.toHaveBeenCalled();
    });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearReadingSession,
  getReadingSession,
  hasReadingSession,
  saveReadingSession,
} from '../../src/session/storage';
import { createMemoryLocalStorage } from '../fakes/memory-local-storage';

describe('reading session storage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryLocalStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saves and reads source text', () => {
    saveReadingSession('  안녕하세요.  ');
    expect(getReadingSession()).toBe('안녕하세요.');
    expect(hasReadingSession()).toBe(true);
  });

  it('clears the saved session', () => {
    saveReadingSession('안녕하세요.');
    clearReadingSession();
    expect(getReadingSession()).toBeNull();
    expect(hasReadingSession()).toBe(false);
  });

  it('does not persist blank text', () => {
    saveReadingSession('안녕하세요.');
    saveReadingSession('   ');
    expect(getReadingSession()).toBeNull();
  });
});

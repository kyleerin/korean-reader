import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearDeepLApiKey, getDeepLApiKey, hasDeepLApiKey, setDeepLApiKey } from '../../src/translation/storage';
import { createMemoryLocalStorage } from '../fakes/memory-local-storage';

describe('DeepL API key storage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryLocalStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('saves and reads a trimmed key', () => {
    setDeepLApiKey('  my-key:fx  ');
    expect(getDeepLApiKey()).toBe('my-key:fx');
    expect(hasDeepLApiKey()).toBe(true);
  });

  it('clears the saved key', () => {
    setDeepLApiKey('my-key:fx');
    clearDeepLApiKey();
    expect(getDeepLApiKey()).toBeNull();
    expect(hasDeepLApiKey()).toBe(false);
  });
});

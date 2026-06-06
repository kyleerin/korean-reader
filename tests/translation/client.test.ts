import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAiTranslation, isTranslationAvailable, TranslationClientError } from '../../src/translation/client';
import { setDeepLApiKey } from '../../src/translation/storage';
import { createMemoryLocalStorage } from '../fakes/memory-local-storage';

describe('isTranslationAvailable', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryLocalStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns false when no key is saved', () => {
    expect(isTranslationAvailable()).toBe(false);
  });

  it('returns true when a key is saved', () => {
    setDeepLApiKey('test-key:fx');
    expect(isTranslationAvailable()).toBe(true);
  });
});

describe('fetchAiTranslation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns translation from the API', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ translation: 'Hello.' }),
    }));

    await expect(fetchAiTranslation('안녕하세요.', 'test-key:fx')).resolves.toBe('Hello.');
    expect(fetch).toHaveBeenCalledWith('/api/translate', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ text: '안녕하세요.', apiKey: 'test-key:fx' }),
    }));
  });

  it('throws on API errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'not configured' }),
    }));

    await expect(fetchAiTranslation('안녕', 'test-key:fx')).rejects.toBeInstanceOf(TranslationClientError);
  });
});

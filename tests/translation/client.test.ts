import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAiTranslation, fetchTranslationEnabled, TranslationClientError } from '../../src/translation/client';

describe('fetchTranslationEnabled', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns true when the API reports enabled', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ enabled: true }),
    }));

    await expect(fetchTranslationEnabled()).resolves.toBe(true);
  });

  it('returns false when the API is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));

    await expect(fetchTranslationEnabled()).resolves.toBe(false);
  });

  it('returns false when translation is disabled', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ enabled: false }),
    }));

    await expect(fetchTranslationEnabled()).resolves.toBe(false);
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

    await expect(fetchAiTranslation('안녕하세요.')).resolves.toBe('Hello.');
  });

  it('throws on API errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'not configured' }),
    }));

    await expect(fetchAiTranslation('안녕')).rejects.toBeInstanceOf(TranslationClientError);
  });
});

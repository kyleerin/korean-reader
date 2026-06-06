import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAiTranslation, TranslationClientError } from '../../src/translation/client';

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

import { describe, expect, it, vi } from 'vitest';
import { processTranslateRequest, processValidateKeyRequest } from '../../server/translate-route';

describe('processTranslateRequest', () => {
  it('rejects missing text', async () => {
    const result = await processTranslateRequest({ apiKey: 'key:fx' });
    expect(result.status).toBe(400);
  });

  it('rejects missing api key', async () => {
    const result = await processTranslateRequest({ text: '안녕' });
    expect(result.status).toBe(400);
  });

  it('returns translation on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ translations: [{ text: 'Hello.' }] }),
    }));

    const result = await processTranslateRequest({
      text: '안녕하세요.',
      apiKey: 'test-key:fx',
    });

    expect(result).toEqual({ status: 200, body: { translation: 'Hello.' } });
    vi.unstubAllGlobals();
  });
});

describe('processValidateKeyRequest', () => {
  it('validates a working key', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

    const result = await processValidateKeyRequest({ apiKey: 'test-key:fx' });
    expect(result).toEqual({ status: 200, body: { ok: true, apiKey: 'test-key:fx' } });
    vi.unstubAllGlobals();
  });
});

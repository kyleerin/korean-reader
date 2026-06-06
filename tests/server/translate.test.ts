import { describe, expect, it, vi } from 'vitest';
import {
  deeplApiBase,
  translateKoreanText,
  TranslationError,
  validateTranslationInput,
} from '../../server/translate';

describe('validateTranslationInput', () => {
  it('rejects empty text', () => {
    expect(() => validateTranslationInput('   ')).toThrow(TranslationError);
  });
});

describe('deeplApiBase', () => {
  it('uses the free API host for :fx keys', () => {
    expect(deeplApiBase('abc:fx')).toBe('https://api-free.deepl.com');
  });

  it('uses the pro API host for other keys', () => {
    expect(deeplApiBase('abc-pro-key')).toBe('https://api.deepl.com');
  });
});

describe('translateKoreanText', () => {
  it('returns DeepL translation text', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        translations: [{ text: 'Hello.\n\nI study Korean.' }],
      }),
    });

    const result = await translateKoreanText('안녕하세요.\n\n한국어를 공부합니다.', {
      fetchFn,
      config: { apiKey: 'test-key:fx' },
    });

    expect(result).toBe('Hello.\n\nI study Korean.');
    expect(fetchFn).toHaveBeenCalledWith(
      'https://api-free.deepl.com/v2/translate',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'DeepL-Auth-Key test-key:fx',
        }),
      }),
    );
    const callBody = fetchFn.mock.calls[0]![1]!.body as string;
    expect(callBody).toContain('source_lang=KO');
    expect(callBody).toContain('target_lang=EN-US');
  });

  it('surfaces provider errors', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => 'forbidden',
    });

    await expect(
      translateKoreanText('안녕', { fetchFn, config: { apiKey: 'bad:fx' } }),
    ).rejects.toMatchObject({ status: 502 });
  });
});

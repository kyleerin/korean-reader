import { describe, expect, it, vi } from 'vitest';
import { translateKoreanText, TranslationError, validateTranslationInput } from '../../server/translate';

describe('validateTranslationInput', () => {
  it('rejects empty text', () => {
    expect(() => validateTranslationInput('   ')).toThrow(TranslationError);
  });
});

describe('translateKoreanText', () => {
  it('returns model output', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Hello.\n\nI study Korean.' } }],
      }),
    });

    const result = await translateKoreanText('안녕하세요.\n\n한국어를 공부합니다.', {
      fetchFn,
      config: { apiKey: 'test-key', model: 'gpt-4o-mini' },
    });

    expect(result).toBe('Hello.\n\nI study Korean.');
    expect(fetchFn).toHaveBeenCalledOnce();
  });

  it('surfaces provider errors', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'unauthorized',
    });

    await expect(
      translateKoreanText('안녕', { fetchFn, config: { apiKey: 'bad' } }),
    ).rejects.toMatchObject({ status: 502 });
  });
});

import { describe, expect, it, vi } from 'vitest';
import {
  formatDeepLAuthError,
  normalizeDeepLApiKey,
  validateDeepLApiKey,
} from '../../server/deepl-key';

describe('normalizeDeepLApiKey', () => {
  it('trims whitespace', () => {
    expect(normalizeDeepLApiKey('  abc:fx  ')).toBe('abc:fx');
  });

  it('strips DeepL-Auth-Key prefix', () => {
    expect(normalizeDeepLApiKey('DeepL-Auth-Key abc:fx')).toBe('abc:fx');
  });

  it('strips surrounding quotes', () => {
    expect(normalizeDeepLApiKey('"abc:fx"')).toBe('abc:fx');
  });
});

describe('formatDeepLAuthError', () => {
  it('returns actionable guidance for 403', () => {
    expect(formatDeepLAuthError(403, '{"message":"invalid"}')).toContain(':fx');
  });
});

describe('validateDeepLApiKey', () => {
  it('returns normalized key when usage succeeds', async () => {
    const fetchFn = vi.fn().mockResolvedValue({ ok: true });
    await expect(validateDeepLApiKey('  key:fx  ', fetchFn)).resolves.toBe('key:fx');
  });

  it('tries alternate host on 403', async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 403, text: async () => 'forbidden' })
      .mockResolvedValueOnce({ ok: true });

    await expect(validateDeepLApiKey('pro-key', fetchFn)).resolves.toBe('pro-key');
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});

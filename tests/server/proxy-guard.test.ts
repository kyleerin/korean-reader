import { describe, expect, it } from 'vitest';
import {
  clientKeyFromRequest,
  createSlidingWindowRateLimiter,
  guardTranslateAccess,
  isOriginAllowed,
  parseAllowedOrigins,
} from '../../server/proxy-guard';

describe('parseAllowedOrigins', () => {
  it('returns null when unset so local dev stays open', () => {
    expect(parseAllowedOrigins(undefined)).toBeNull();
    expect(parseAllowedOrigins('')).toBeNull();
    expect(parseAllowedOrigins('  ')).toBeNull();
  });

  it('parses a comma-separated allowlist', () => {
    expect(parseAllowedOrigins('https://a.example, https://b.example')).toEqual([
      'https://a.example',
      'https://b.example',
    ]);
  });
});

describe('isOriginAllowed', () => {
  it('allows any origin when unrestricted', () => {
    expect(isOriginAllowed(undefined, null)).toBe(true);
    expect(isOriginAllowed('https://app.example', null)).toBe(true);
  });

  it('requires an allowlisted origin when restricted', () => {
    const allowed = ['https://app.example'];
    expect(isOriginAllowed('https://app.example', allowed)).toBe(true);
    expect(isOriginAllowed('https://evil.example', allowed)).toBe(false);
    expect(isOriginAllowed(undefined, allowed)).toBe(false);
  });
});

describe('clientKeyFromRequest', () => {
  it('prefers the first x-forwarded-for hop', () => {
    expect(clientKeyFromRequest({ 'x-forwarded-for': '1.1.1.1, 2.2.2.2' })).toBe('1.1.1.1');
  });

  it('falls back to x-real-ip then local', () => {
    expect(clientKeyFromRequest({ 'x-real-ip': '9.9.9.9' })).toBe('9.9.9.9');
    expect(clientKeyFromRequest({})).toBe('local');
  });
});

describe('guardTranslateAccess', () => {
  it('rejects disallowed origins', () => {
    const result = guardTranslateAccess({
      origin: 'https://evil.example',
      clientKey: '1.1.1.1',
      allowedOrigins: ['https://app.example'],
      rateLimiter: createSlidingWindowRateLimiter({ windowMs: 60_000, max: 10 }),
    });
    expect(result).toEqual({ ok: false, status: 403, body: { error: 'Origin not allowed.' } });
  });

  it('rate-limits repeated clients', () => {
    const rateLimiter = createSlidingWindowRateLimiter({ windowMs: 60_000, max: 2 });
    const base = {
      origin: 'https://app.example',
      clientKey: 'rate-limit-client',
      allowedOrigins: null as string[] | null,
      rateLimiter,
    };
    expect(guardTranslateAccess(base).ok).toBe(true);
    expect(guardTranslateAccess(base).ok).toBe(true);
    expect(guardTranslateAccess(base)).toEqual({
      ok: false,
      status: 429,
      body: { error: 'Too many translation requests. Try again shortly.' },
    });
  });
});

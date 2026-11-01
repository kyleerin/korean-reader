/** Max JSON body size for POST /api/translate (covers 12k Hangul + key + overhead). */
export const MAX_TRANSLATE_BODY_BYTES = 64_000;

/** Default: 30 translate calls per client key per rolling minute. */
export const DEFAULT_TRANSLATE_RATE_LIMIT = { windowMs: 60_000, max: 30 } as const;

export interface RateLimiter {
  /** Returns true when the request is allowed. */
  allow(clientKey: string): boolean;
}

/**
 * In-memory sliding-window limiter. Best-effort on multi-instance hosts
 * (each instance tracks its own window).
 */
export function createSlidingWindowRateLimiter(
  options: { windowMs: number; max: number } = DEFAULT_TRANSLATE_RATE_LIMIT,
): RateLimiter {
  const hits = new Map<string, number[]>();

  return {
    allow(clientKey: string): boolean {
      const now = Date.now();
      const windowStart = now - options.windowMs;
      const prior = hits.get(clientKey) ?? [];
      const recent = prior.filter(t => t > windowStart);
      if (recent.length >= options.max) {
        hits.set(clientKey, recent);
        return false;
      }
      recent.push(now);
      hits.set(clientKey, recent);
      return true;
    },
  };
}

/** Shared limiter for Node / Vite / warm serverless isolates. */
export const defaultTranslateRateLimiter = createSlidingWindowRateLimiter();

/**
 * Parse TRANSLATE_ALLOWED_ORIGINS (comma-separated).
 * Returns null when unset/empty → origins are not restricted (local default).
 */
export function parseAllowedOrigins(raw: string | undefined | null): string[] | null {
  if (raw == null || !raw.trim()) return null;
  const origins = raw.split(',').map(s => s.trim()).filter(Boolean);
  return origins.length > 0 ? origins : null;
}

export function isOriginAllowed(
  origin: string | undefined | null,
  allowed: string[] | null,
): boolean {
  if (allowed == null) return true;
  if (!origin) return false;
  return allowed.includes(origin);
}

export function clientKeyFromRequest(headers: {
  'x-forwarded-for'?: string | string[] | undefined;
  'x-real-ip'?: string | string[] | undefined;
}, fallback = 'local'): string {
  const forwarded = headerValue(headers['x-forwarded-for']);
  if (forwarded) return forwarded.split(',')[0]!.trim() || fallback;
  const realIp = headerValue(headers['x-real-ip']);
  if (realIp) return realIp.trim() || fallback;
  return fallback;
}

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export type AccessDenial = { ok: false; status: number; body: { error: string } };
export type AccessOk = { ok: true };

export function guardTranslateAccess(input: {
  origin?: string | null;
  clientKey: string;
  allowedOrigins?: string[] | null;
  rateLimiter?: RateLimiter;
}): AccessOk | AccessDenial {
  const allowedOrigins = input.allowedOrigins === undefined
    ? parseAllowedOrigins(process.env.TRANSLATE_ALLOWED_ORIGINS)
    : input.allowedOrigins;

  if (!isOriginAllowed(input.origin, allowedOrigins)) {
    return { status: 403, body: { error: 'Origin not allowed.' }, ok: false };
  }

  const limiter = input.rateLimiter ?? defaultTranslateRateLimiter;
  if (!limiter.allow(input.clientKey)) {
    return { status: 429, body: { error: 'Too many translation requests. Try again shortly.' }, ok: false };
  }

  return { ok: true };
}

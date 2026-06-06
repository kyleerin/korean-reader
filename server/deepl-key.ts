import { deeplApiBase, TranslationError } from './translate.js';

const AUTH_PREFIX = /^deepl-auth-key\s+/i;

export function normalizeDeepLApiKey(raw: string): string {
  let key = raw.trim();
  key = key.replace(AUTH_PREFIX, '');
  if (
    (key.startsWith('"') && key.endsWith('"'))
    || (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }
  return key;
}

export function formatDeepLAuthError(status: number, detail: string): string {
  if (status !== 403) {
    return `Translation provider error (${status})${detail ? `: ${detail.slice(0, 200)}` : ''}`;
  }

  const lower = detail.toLowerCase();
  if (lower.includes('invalid')) {
    return [
      'DeepL rejected this API key.',
      'Copy the full key from https://www.deepl.com/pro-account/keys — free keys must end with :fx.',
      'Remove any extra spaces or "DeepL-Auth-Key" prefix.',
    ].join(' ');
  }

  return [
    'DeepL authentication failed (403).',
    'Use a DeepL API key (not a Google/other login). Free keys end with :fx.',
  ].join(' ');
}

export async function validateDeepLApiKey(
  rawKey: string,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  const apiKey = normalizeDeepLApiKey(rawKey);
  if (!apiKey) throw new TranslationError('API key is required.', 400);

  const bases = uniqueApiBases(apiKey);
  let lastDetail = '';

  for (const base of bases) {
    const response = await fetchFn(`${base}/v2/usage`, {
      headers: { Authorization: `DeepL-Auth-Key ${apiKey}` },
    });
    if (response.ok) return apiKey;

    lastDetail = await response.text().catch(() => '');
    if (response.status !== 403) {
      throw new TranslationError(formatDeepLAuthError(response.status, lastDetail), response.status);
    }
  }

  throw new TranslationError(formatDeepLAuthError(403, lastDetail), 403);
}

function uniqueApiBases(apiKey: string): string[] {
  const primary = deeplApiBase(apiKey);
  const alternate = primary.includes('api-free')
    ? 'https://api.deepl.com'
    : 'https://api-free.deepl.com';
  return primary === alternate ? [primary] : [primary, alternate];
}

export function apiBasesForKey(apiKey: string, override?: string): string[] {
  if (override) return [override.replace(/\/$/, '')];
  return uniqueApiBases(apiKey);
}

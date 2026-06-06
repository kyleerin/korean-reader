export const MAX_TRANSLATION_CHARS = 12_000;

export interface DeepLConfig {
  apiKey: string;
  /** Override API host, e.g. https://api-free.deepl.com */
  apiBase?: string;
  sourceLang?: string;
  targetLang?: string;
}

export interface TranslateDeps {
  fetchFn?: typeof fetch;
  config: DeepLConfig;
}

export function validateTranslationInput(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) throw new TranslationError('Text is required.', 400);
  if (trimmed.length > MAX_TRANSLATION_CHARS) {
    throw new TranslationError(`Text exceeds ${MAX_TRANSLATION_CHARS} characters.`, 413);
  }
  return trimmed;
}

export class TranslationError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'TranslationError';
  }
}

/** Free DeepL keys end with :fx and use the api-free host. */
export function deeplApiBase(apiKey: string, override?: string): string {
  if (override) return override.replace(/\/$/, '');
  return apiKey.endsWith(':fx')
    ? 'https://api-free.deepl.com'
    : 'https://api.deepl.com';
}

export async function translateKoreanText(
  text: string,
  deps: TranslateDeps,
): Promise<string> {
  const input = validateTranslationInput(text);
  const fetchFn = deps.fetchFn ?? fetch;
  const apiBase = deeplApiBase(deps.config.apiKey, deps.config.apiBase);
  const sourceLang = deps.config.sourceLang ?? 'KO';
  const targetLang = deps.config.targetLang ?? 'EN-US';

  const body = new URLSearchParams({
    text: input,
    source_lang: sourceLang,
    target_lang: targetLang,
  });

  const response = await fetchFn(`${apiBase}/v2/translate`, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${deps.config.apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new TranslationError(
      `Translation provider error (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`,
      response.status === 429 ? 429 : 502,
    );
  }

  const payload = await response.json() as {
    translations?: { text?: string }[];
  };
  const parts = payload.translations?.map(t => t.text?.trim()).filter(Boolean) as string[] | undefined;
  if (!parts?.length) throw new TranslationError('Empty translation response.', 502);
  return parts.join('\n\n');
}

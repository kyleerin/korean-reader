import { translateKoreanText, TranslationError, type DeepLConfig } from './translate.js';

export interface TranslateRequestBody {
  text?: unknown;
  apiKey?: unknown;
}

export async function processTranslateRequest(
  body: TranslateRequestBody,
  configOverrides?: Partial<DeepLConfig>,
): Promise<{ status: number; body: Record<string, unknown> }> {
  if (typeof body.text !== 'string') {
    return {
      status: 400,
      body: { error: 'Expected JSON body: { "text": string, "apiKey": string }' },
    };
  }
  if (typeof body.apiKey !== 'string' || !body.apiKey.trim()) {
    return { status: 400, body: { error: 'DeepL API key is required.' } };
  }

  try {
    const translation = await translateKoreanText(body.text, {
      config: { apiKey: body.apiKey.trim(), ...configOverrides },
    });
    return { status: 200, body: { translation } };
  } catch (err) {
    if (err instanceof TranslationError) {
      return { status: err.status, body: { error: err.message } };
    }
    throw err;
  }
}

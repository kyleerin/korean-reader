export const MAX_TRANSLATION_CHARS = 12_000;

const SYSTEM_PROMPT = `You are a professional Korean-to-English translator for language learners.
Translate the user's Korean text into natural, fluent English.
Preserve paragraph breaks (use blank lines between paragraphs).
Output only the English translation — no notes, romanization, or commentary.`;

export interface OpenAiConfig {
  apiKey: string;
  model?: string;
}

export interface TranslateDeps {
  fetchFn?: typeof fetch;
  config: OpenAiConfig;
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

export async function translateKoreanText(
  text: string,
  deps: TranslateDeps,
): Promise<string> {
  const input = validateTranslationInput(text);
  const fetchFn = deps.fetchFn ?? fetch;
  const model = deps.config.model ?? 'gpt-4o-mini';

  const response = await fetchFn('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${deps.config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: input },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new TranslationError(
      `Translation provider error (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ''}`,
      response.status === 429 ? 429 : 502,
    );
  }

  const payload = await response.json() as {
    choices?: { message?: { content?: string } }[];
  };
  const translation = payload.choices?.[0]?.message?.content?.trim();
  if (!translation) throw new TranslationError('Empty translation response.', 502);
  return translation;
}

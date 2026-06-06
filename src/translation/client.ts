export class TranslationClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'TranslationClientError';
  }
}

function apiBase(): string {
  return import.meta.env.VITE_API_BASE ?? '';
}

export async function fetchAiTranslation(text: string): Promise<string> {
  const res = await fetch(`${apiBase()}/api/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  const payload = await res.json().catch(() => ({})) as { translation?: string; error?: string };
  if (!res.ok) {
    throw new TranslationClientError(
      payload.error ?? `Translation request failed (${res.status})`,
      res.status,
    );
  }

  if (!payload.translation?.trim()) {
    throw new TranslationClientError('Empty translation response.', 502);
  }

  return payload.translation.trim();
}

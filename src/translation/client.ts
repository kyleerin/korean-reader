import { apiFetch } from '../api/client';

export class TranslationClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'TranslationClientError';
  }
}

export async function fetchTranslationEnabled(): Promise<boolean> {
  try {
    const res = await apiFetch('/api/translate/config');
    if (!res.ok) return false;
    const payload = await res.json() as { enabled?: boolean };
    return payload.enabled === true;
  } catch {
    return false;
  }
}

export async function fetchAiTranslation(text: string): Promise<string> {
  const res = await apiFetch('/api/translate', {
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

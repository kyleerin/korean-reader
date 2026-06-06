import { processValidateKeyRequest } from '../server/translate-route.js';

interface VercelRequest {
  method?: string;
  body?: unknown;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): void;
  end(): void;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const body = typeof req.body === 'object' && req.body !== null
      ? req.body
      : {};
    const result = await processValidateKeyRequest(body);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('DeepL key validation error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

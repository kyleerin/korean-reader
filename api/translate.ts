import { processTranslateRequest } from '../server/translate-route.js';
import {
  clientKeyFromRequest,
  guardTranslateAccess,
  MAX_TRANSLATE_BODY_BYTES,
  parseAllowedOrigins,
} from '../server/proxy-guard.js';

interface VercelRequest {
  method?: string;
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): void;
  end(): void;
}

const ALLOWED_ORIGINS = parseAllowedOrigins(process.env.TRANSLATE_ALLOWED_ORIGINS);

function header(req: VercelRequest, name: string): string | undefined {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
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

  const origin = header(req, 'origin');
  const access = guardTranslateAccess({
    origin,
    clientKey: clientKeyFromRequest({
      'x-forwarded-for': header(req, 'x-forwarded-for'),
      'x-real-ip': header(req, 'x-real-ip'),
    }),
    allowedOrigins: ALLOWED_ORIGINS,
  });
  if (!access.ok) {
    res.status(access.status).json(access.body);
    return;
  }

  try {
    const body = typeof req.body === 'object' && req.body !== null
      ? req.body
      : {};
    // Soft size check on already-parsed bodies (Vercel parses JSON before the handler).
    const encoded = JSON.stringify(body);
    if (encoded.length > MAX_TRANSLATE_BODY_BYTES) {
      res.status(413).json({ error: `Request body exceeds ${MAX_TRANSLATE_BODY_BYTES} bytes.` });
      return;
    }
    const result = await processTranslateRequest(body);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error('Translation error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

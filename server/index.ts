import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { corsAllowOrigin, HttpBodyError, readJsonBody, sendJson } from './http.js';
import {
  clientKeyFromRequest,
  guardTranslateAccess,
  parseAllowedOrigins,
} from './proxy-guard.js';
import { processTranslateRequest } from './translate-route.js';

const PORT = Number(process.env.PORT ?? 3001);
const API_BASE = process.env.DEEPL_API_URL;
const SOURCE_LANG = process.env.DEEPL_SOURCE_LANG;
const TARGET_LANG = process.env.DEEPL_TARGET_LANG;
const ALLOWED_ORIGINS = parseAllowedOrigins(process.env.TRANSLATE_ALLOWED_ORIGINS);

function requestOrigin(req: IncomingMessage): string | undefined {
  const value = req.headers.origin;
  return Array.isArray(value) ? value[0] : value;
}

function respond(req: IncomingMessage, res: ServerResponse, status: number, body: unknown): void {
  const origin = requestOrigin(req);
  const allow = corsAllowOrigin(origin, ALLOWED_ORIGINS);
  // Always send CORS headers when unrestricted; when restricted, only echo allowlisted origins.
  sendJson(res, status, body, allow ?? (ALLOWED_ORIGINS == null ? '*' : undefined));
}

const server = createServer(async (req, res) => {
  const origin = requestOrigin(req);

  if (req.method === 'OPTIONS') {
    if (ALLOWED_ORIGINS != null && !corsAllowOrigin(origin, ALLOWED_ORIGINS)) {
      sendJson(res, 403, { error: 'Origin not allowed.' });
      return;
    }
    respond(req, res, 204, {});
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/translate') {
    respond(req, res, 404, { error: 'Not found' });
    return;
  }

  const access = guardTranslateAccess({
    origin,
    clientKey: clientKeyFromRequest(req.headers),
    allowedOrigins: ALLOWED_ORIGINS,
  });
  if (!access.ok) {
    respond(req, res, access.status, access.body);
    return;
  }

  try {
    const body = await readJsonBody(req);
    const result = await processTranslateRequest(body as Parameters<typeof processTranslateRequest>[0], {
      apiBase: API_BASE,
      sourceLang: SOURCE_LANG,
      targetLang: TARGET_LANG,
    });
    respond(req, res, result.status, result.body);
  } catch (err) {
    if (err instanceof HttpBodyError) {
      respond(req, res, err.status, { error: err.message });
      return;
    }
    if (err instanceof SyntaxError) {
      respond(req, res, 400, { error: 'Invalid JSON body.' });
      return;
    }
    // Never log request bodies — they may contain the user's DeepL API key.
    console.error('Translation error:', err instanceof Error ? err.message : err);
    respond(req, res, 500, { error: 'Internal server error.' });
  }
});

server.listen(PORT, () => {
  console.log(`Translation API listening on http://localhost:${PORT}`);
});

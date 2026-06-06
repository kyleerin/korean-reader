import { createServer } from 'node:http';
import { verifyGoogleCredential, AuthError } from './auth.js';
import {
  clearSessionCookie,
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from './session.js';
import {
  corsHeaders,
  isProduction,
  readJsonBody,
  readSessionUser,
  sendJson,
} from './http.js';
import { translateKoreanText, TranslationError } from './translate.js';

const PORT = Number(process.env.PORT ?? 3001);
const API_KEY = process.env.DEEPL_API_KEY;
const API_BASE = process.env.DEEPL_API_URL;
const SOURCE_LANG = process.env.DEEPL_SOURCE_LANG;
const TARGET_LANG = process.env.DEEPL_TARGET_LANG;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const SESSION_SECRET = process.env.SESSION_SECRET;

const server = createServer(async (req, res) => {
  if (!req.url) {
    sendJson(req, res, 400, { error: 'Bad request' });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders(req));
    res.end();
    return;
  }

  try {
    if (req.method === 'GET' && req.url === '/api/auth/config') {
      sendJson(req, res, 200, {
        enabled: Boolean(GOOGLE_CLIENT_ID && SESSION_SECRET),
        googleClientId: GOOGLE_CLIENT_ID ?? undefined,
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/api/auth/me') {
      const user = await readSessionUser(req);
      if (!user) {
        sendJson(req, res, 401, { error: 'Not signed in.' });
        return;
      }
      sendJson(req, res, 200, { user });
      return;
    }

    if (req.method === 'POST' && req.url === '/api/auth/google') {
      if (!GOOGLE_CLIENT_ID || !SESSION_SECRET) {
        sendJson(req, res, 503, { error: 'Google sign-in is not configured.' });
        return;
      }

      const body = await readJsonBody(req) as { credential?: unknown };
      if (typeof body.credential !== 'string') {
        sendJson(req, res, 400, { error: 'Expected JSON body: { "credential": string }' });
        return;
      }

      const user = await verifyGoogleCredential(body.credential, {
        config: { clientId: GOOGLE_CLIENT_ID },
      });
      const token = await createSessionToken(user, SESSION_SECRET);
      sendJson(req, res, 200, { user }, {
        'Set-Cookie': `${SESSION_COOKIE}=${token}; ${sessionCookieOptions(isProduction())}`,
      });
      return;
    }

    if (req.method === 'POST' && req.url === '/api/auth/logout') {
      sendJson(req, res, 200, { ok: true }, {
        'Set-Cookie': `${SESSION_COOKIE}=; ${clearSessionCookie(isProduction())}`,
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/api/translate/config') {
      sendJson(req, res, 200, { enabled: Boolean(API_KEY) });
      return;
    }

    if (req.method === 'POST' && req.url === '/api/translate') {
      if (!API_KEY) {
        sendJson(req, res, 503, { error: 'Translation service is not configured (missing DEEPL_API_KEY).' });
        return;
      }

      const body = await readJsonBody(req) as { text?: unknown };
      if (typeof body.text !== 'string') {
        sendJson(req, res, 400, { error: 'Expected JSON body: { "text": string }' });
        return;
      }

      const translation = await translateKoreanText(body.text, {
        config: {
          apiKey: API_KEY,
          apiBase: API_BASE,
          sourceLang: SOURCE_LANG,
          targetLang: TARGET_LANG,
        },
      });
      sendJson(req, res, 200, { translation });
      return;
    }

    sendJson(req, res, 404, { error: 'Not found' });
  } catch (err) {
    if (err instanceof AuthError) {
      sendJson(req, res, err.status, { error: err.message });
      return;
    }
    if (err instanceof TranslationError) {
      sendJson(req, res, err.status, { error: err.message });
      return;
    }
    if (err instanceof SyntaxError) {
      sendJson(req, res, 400, { error: 'Invalid JSON body.' });
      return;
    }
    console.error('API error:', err);
    sendJson(req, res, 500, { error: 'Internal server error.' });
  }
});

server.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});

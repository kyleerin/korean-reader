import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { HttpBodyError, readJsonBody } from './server/http';
import {
  clientKeyFromRequest,
  guardTranslateAccess,
  parseAllowedOrigins,
} from './server/proxy-guard';
import { processTranslateRequest } from './server/translate-route';

const ALLOWED_ORIGINS = parseAllowedOrigins(process.env.TRANSLATE_ALLOWED_ORIGINS);

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function requestOrigin(req: IncomingMessage): string | undefined {
  const value = req.headers.origin;
  return Array.isArray(value) ? value[0] : value;
}

async function handleTranslate(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const origin = requestOrigin(req);
  const access = guardTranslateAccess({
    origin,
    clientKey: clientKeyFromRequest(req.headers),
    allowedOrigins: ALLOWED_ORIGINS,
  });
  if (!access.ok) {
    sendJson(res, access.status, access.body);
    return;
  }

  try {
    const body = await readJsonBody(req);
    const result = await processTranslateRequest(body as Parameters<typeof processTranslateRequest>[0]);
    sendJson(res, result.status, result.body);
  } catch (err) {
    if (err instanceof HttpBodyError) {
      sendJson(res, err.status, { error: err.message });
      return;
    }
    if (err instanceof SyntaxError) {
      sendJson(res, 400, { error: 'Invalid JSON body.' });
      return;
    }
    console.error('Translation error:', err instanceof Error ? err.message : err);
    sendJson(res, 500, { error: 'Internal server error.' });
  }
}

function translateApiMiddleware() {
  return (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void): void => {
    const path = req.url?.split('?')[0];
    if (path !== '/api/translate') {
      next();
      return;
    }

    if (req.method === 'OPTIONS') {
      sendJson(res, 204, {});
      return;
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'Method not allowed.' });
      return;
    }

    void handleTranslate(req, res);
  };
}

export function translateApiPlugin(): Plugin {
  const middleware = translateApiMiddleware();
  return {
    name: 'translate-api',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

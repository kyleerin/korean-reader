import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { translateKoreanText, TranslationError } from './server/translate';

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw) as unknown;
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function handleTranslate(req: IncomingMessage, res: ServerResponse): Promise<void> {
  try {
    const body = await readJsonBody(req) as { text?: unknown; apiKey?: unknown };
    if (typeof body.text !== 'string') {
      sendJson(res, 400, { error: 'Expected JSON body: { "text": string, "apiKey": string }' });
      return;
    }
    if (typeof body.apiKey !== 'string' || !body.apiKey.trim()) {
      sendJson(res, 400, { error: 'DeepL API key is required.' });
      return;
    }

    const translation = await translateKoreanText(body.text, {
      config: { apiKey: body.apiKey.trim() },
    });
    sendJson(res, 200, { translation });
  } catch (err) {
    if (err instanceof TranslationError) {
      sendJson(res, err.status, { error: err.message });
      return;
    }
    if (err instanceof SyntaxError) {
      sendJson(res, 400, { error: 'Invalid JSON body.' });
      return;
    }
    console.error('Translation error:', err);
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

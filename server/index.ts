import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { processTranslateRequest, processValidateKeyRequest } from './translate-route.js';

const PORT = Number(process.env.PORT ?? 3001);
const API_BASE = process.env.DEEPL_API_URL;
const SOURCE_LANG = process.env.DEEPL_SOURCE_LANG;
const TARGET_LANG = process.env.DEEPL_TARGET_LANG;

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(body));
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw) as unknown;
}

const routes: Record<string, (body: unknown) => ReturnType<typeof processTranslateRequest>> = {
  '/api/translate': body => processTranslateRequest(body as Parameters<typeof processTranslateRequest>[0], {
    apiBase: API_BASE,
    sourceLang: SOURCE_LANG,
    targetLang: TARGET_LANG,
  }),
  '/api/validate-deepl-key': body => processValidateKeyRequest(body as Parameters<typeof processValidateKeyRequest>[0]),
};

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  const route = req.url ? routes[req.url] : undefined;
  if (req.method !== 'POST' || !route) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const result = await route(body);
    sendJson(res, result.status, result.body);
  } catch (err) {
    if (err instanceof SyntaxError) {
      sendJson(res, 400, { error: 'Invalid JSON body.' });
      return;
    }
    console.error('API error:', err);
    sendJson(res, 500, { error: 'Internal server error.' });
  }
});

server.listen(PORT, () => {
  console.log(`Translation API listening on http://localhost:${PORT}`);
});

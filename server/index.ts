import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { translateKoreanText, TranslationError } from './translate.js';

const PORT = Number(process.env.PORT ?? 3001);
const API_KEY = process.env.DEEPL_API_KEY;
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

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 204, {});
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/translate') {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  if (!API_KEY) {
    sendJson(res, 503, { error: 'Translation service is not configured (missing DEEPL_API_KEY).' });
    return;
  }

  try {
    const body = await readJsonBody(req) as { text?: unknown };
    if (typeof body.text !== 'string') {
      sendJson(res, 400, { error: 'Expected JSON body: { "text": string }' });
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
});

server.listen(PORT, () => {
  console.log(`Translation API listening on http://localhost:${PORT}`);
});

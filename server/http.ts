import type { IncomingMessage, ServerResponse } from 'node:http';
import { MAX_TRANSLATE_BODY_BYTES } from './proxy-guard.js';

export class HttpBodyError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'HttpBodyError';
  }
}

export async function readJsonBody(
  req: IncomingMessage,
  maxBytes = MAX_TRANSLATE_BODY_BYTES,
): Promise<unknown> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of req) {
    const buf = chunk as Buffer;
    total += buf.length;
    if (total > maxBytes) {
      throw new HttpBodyError(`Request body exceeds ${maxBytes} bytes.`, 413);
    }
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw) as unknown;
}

export function sendJson(
  res: ServerResponse,
  status: number,
  body: unknown,
  corsOrigin?: string | null,
): void {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (corsOrigin) {
    headers['Access-Control-Allow-Origin'] = corsOrigin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers.Vary = 'Origin';
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

/** Resolve Access-Control-Allow-Origin for a request. */
export function corsAllowOrigin(
  requestOrigin: string | undefined | null,
  allowedOrigins: string[] | null,
): string | null {
  if (allowedOrigins == null) {
    // Unrestricted mode (local default): echo origin when present, else *.
    return requestOrigin || '*';
  }
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) return requestOrigin;
  return null;
}

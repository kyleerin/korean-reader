import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  parseCookies,
  SESSION_COOKIE,
  verifySessionToken,
  type SessionUser,
} from './session.js';

const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

export function allowedOrigins(): string[] {
  const fromEnv = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()).filter(Boolean);
  return fromEnv?.length ? fromEnv : DEFAULT_ORIGINS;
}

export function corsHeaders(req: IncomingMessage): Record<string, string> {
  const origin = req.headers.origin;
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };
  if (origin && allowedOrigins().includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
  }
  return headers;
}

export function sendJson(
  req: IncomingMessage,
  res: ServerResponse,
  status: number,
  body: unknown,
  extraHeaders?: Record<string, string>,
): void {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    ...corsHeaders(req),
    ...extraHeaders,
  });
  res.end(JSON.stringify(body));
}

export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw) as unknown;
}

export async function readSessionUser(req: IncomingMessage): Promise<SessionUser | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!token) return null;
  return verifySessionToken(token, secret);
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

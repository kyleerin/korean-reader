import { SignJWT, jwtVerify } from 'jose';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export const SESSION_COOKIE = 'kr_session';
const SESSION_DAYS = 7;

function secretKey(secret: string): Uint8Array {
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  user: SessionUser,
  secret: string,
): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey(secret));
}

export async function verifySessionToken(
  token: string,
  secret: string,
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(secret));
    if (typeof payload.id !== 'string' || typeof payload.email !== 'string' || typeof payload.name !== 'string') {
      return null;
    }
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      picture: typeof payload.picture === 'string' ? payload.picture : undefined,
    };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(secure: boolean): string {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  const parts = [
    `Max-Age=${maxAge}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookie(secure: boolean): string {
  const parts = [
    'Max-Age=0',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map(part => {
      const [key, ...rest] = part.trim().split('=');
      return [key, decodeURIComponent(rest.join('='))];
    }),
  );
}

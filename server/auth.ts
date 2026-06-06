import { OAuth2Client } from 'google-auth-library';
import type { SessionUser } from './session.js';

export interface GoogleAuthConfig {
  clientId: string;
}

export interface GoogleAuthDeps {
  client?: OAuth2Client;
  config: GoogleAuthConfig;
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function verifyGoogleCredential(
  credential: string,
  deps: GoogleAuthDeps,
): Promise<SessionUser> {
  if (!credential.trim()) throw new AuthError('Google credential is required.', 400);

  const client = deps.client ?? new OAuth2Client(deps.config.clientId);
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: deps.config.clientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new AuthError('Invalid Google credential.', 401);
  }

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name ?? payload.email,
    picture: payload.picture,
  };
}

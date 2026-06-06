import { randomUUID } from 'node:crypto';
import { hashPassword, verifyPassword } from './password.js';
import type { SessionUser } from './session.js';
import type { UserStore } from './users.js';
import { validateEmail, validateName, validatePassword } from './validation.js';

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export function toSessionUser(record: { id: string; email: string; name: string }): SessionUser {
  return {
    id: record.id,
    email: record.email,
    name: record.name,
  };
}

export async function registerUser(
  store: UserStore,
  input: { email: string; password: string; name?: unknown },
): Promise<SessionUser> {
  const email = validateEmail(input.email);
  const password = validatePassword(input.password);
  const name = validateName(input.name, email);

  if (store.findByEmail(email)) {
    throw new AuthError('An account with this email already exists.', 409);
  }

  const user = {
    id: randomUUID(),
    email,
    name,
    password_hash: await hashPassword(password),
    created_at: new Date().toISOString(),
  };

  try {
    store.create(user);
  } catch {
    throw new AuthError('An account with this email already exists.', 409);
  }

  return toSessionUser(user);
}

export async function loginUser(
  store: UserStore,
  input: { email: string; password: string },
): Promise<SessionUser> {
  const email = validateEmail(input.email);
  const password = validatePassword(input.password);

  const record = store.findByEmail(email);
  if (!record || !(await verifyPassword(password, record.password_hash))) {
    throw new AuthError('Invalid email or password.', 401);
  }

  return toSessionUser(record);
}

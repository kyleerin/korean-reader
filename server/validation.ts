import { AuthError } from './auth.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): string {
  const normalized = normalizeEmail(email);
  if (!normalized) throw new AuthError('Email is required.', 400);
  if (!EMAIL_RE.test(normalized)) throw new AuthError('Invalid email address.', 400);
  return normalized;
}

export function validatePassword(password: string): string {
  if (!password) throw new AuthError('Password is required.', 400);
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AuthError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`, 400);
  }
  return password;
}

export function validateName(name: unknown, email: string): string {
  if (typeof name === 'string' && name.trim()) return name.trim().slice(0, 80);
  return email.split('@')[0] ?? 'User';
}

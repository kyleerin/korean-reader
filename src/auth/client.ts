import { apiFetch, apiJson } from '../api/client';
import type { AuthConfig, User } from './types';

export async function fetchAuthConfig(): Promise<AuthConfig> {
  try {
    return await apiJson<AuthConfig>('/api/auth/config');
  } catch {
    return { enabled: false };
  }
}

export async function fetchCurrentUser(): Promise<User | null> {
  const res = await apiFetch('/api/auth/me');
  if (res.status === 401) return null;
  if (!res.ok) throw new Error('Failed to load user session.');
  const payload = await res.json() as { user?: User };
  return payload.user ?? null;
}

export async function register(
  email: string,
  password: string,
  name?: string,
): Promise<User> {
  const payload = await apiJson<{ user: User }>('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  return payload.user;
}

export async function login(email: string, password: string): Promise<User> {
  const payload = await apiJson<{ user: User }>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return payload.user;
}

export async function signOut(): Promise<void> {
  await apiJson('/api/auth/logout', { method: 'POST' });
}

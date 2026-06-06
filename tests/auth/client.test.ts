import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAuthConfig, fetchCurrentUser, login, register } from '../../src/auth/client';

describe('auth client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads auth config', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ enabled: true }),
    }));

    await expect(fetchAuthConfig()).resolves.toEqual({ enabled: true });
  });

  it('returns null when not signed in', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Not signed in.' }),
    }));

    await expect(fetchCurrentUser()).resolves.toBeNull();
  });

  it('registers and returns the user', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        user: { id: 'u1', email: 'a@b.co', name: 'Alice' },
      }),
    }));

    await expect(register('a@b.co', 'password123', 'Alice')).resolves.toEqual({
      id: 'u1',
      email: 'a@b.co',
      name: 'Alice',
    });
  });

  it('logs in and returns the user', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        user: { id: 'u1', email: 'a@b.co', name: 'Alice' },
      }),
    }));

    await expect(login('a@b.co', 'password123')).resolves.toEqual({
      id: 'u1',
      email: 'a@b.co',
      name: 'Alice',
    });
  });
});

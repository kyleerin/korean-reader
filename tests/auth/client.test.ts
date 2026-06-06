import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAuthConfig, fetchCurrentUser } from '../../src/auth/client';

describe('auth client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads auth config', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ enabled: true, googleClientId: 'client-id' }),
    }));

    await expect(fetchAuthConfig()).resolves.toEqual({
      enabled: true,
      googleClientId: 'client-id',
    });
  });

  it('returns null when not signed in', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Not signed in.' }),
    }));

    await expect(fetchCurrentUser()).resolves.toBeNull();
  });
});

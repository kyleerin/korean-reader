import { describe, expect, it, vi } from 'vitest';
import type { OAuth2Client } from 'google-auth-library';
import { verifyGoogleCredential } from '../../server/auth';

describe('verifyGoogleCredential', () => {
  it('maps a verified Google payload to a session user', async () => {
    const client = {
      verifyIdToken: vi.fn().mockResolvedValue({
        getPayload: () => ({
          sub: 'google-123',
          email: 'learner@example.com',
          name: 'Learner',
          picture: 'https://example.com/photo.jpg',
        }),
      }),
    } as unknown as OAuth2Client;

    const user = await verifyGoogleCredential('token', {
      client,
      config: { clientId: 'client-id' },
    });

    expect(user).toEqual({
      id: 'google-123',
      email: 'learner@example.com',
      name: 'Learner',
      picture: 'https://example.com/photo.jpg',
    });
  });
});

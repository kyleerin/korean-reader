import { describe, expect, it } from 'vitest';
import { createSessionToken, verifySessionToken } from '../../server/session';

describe('session tokens', () => {
  it('round-trips user data', async () => {
    const user = {
      id: 'google-123',
      email: 'learner@example.com',
      name: 'Learner',
      picture: 'https://example.com/photo.jpg',
    };
    const token = await createSessionToken(user, 'test-secret');
    const parsed = await verifySessionToken(token, 'test-secret');
    expect(parsed).toEqual(user);
  });

  it('rejects tampered tokens', async () => {
    const token = await createSessionToken({
      id: '1',
      email: 'a@b.com',
      name: 'A',
    }, 'test-secret');
    expect(await verifySessionToken(`${token}x`, 'test-secret')).toBeNull();
  });
});

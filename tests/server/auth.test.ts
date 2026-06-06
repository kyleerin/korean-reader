import { describe, expect, it } from 'vitest';
import { AuthError, loginUser, registerUser } from '../../server/auth';
import { InMemoryUserStore } from '../../server/users';

describe('registerUser', () => {
  it('creates a user and returns a session user', async () => {
    const store = new InMemoryUserStore();
    const user = await registerUser(store, {
      email: 'learner@example.com',
      password: 'password123',
      name: 'Learner',
    });

    expect(user).toEqual({
      id: expect.any(String),
      email: 'learner@example.com',
      name: 'Learner',
    });
    expect(store.findByEmail('learner@example.com')).toBeDefined();
  });

  it('rejects duplicate email', async () => {
    const store = new InMemoryUserStore();
    await registerUser(store, { email: 'dup@example.com', password: 'password123' });

    await expect(
      registerUser(store, { email: 'dup@example.com', password: 'otherpass1' }),
    ).rejects.toMatchObject({ status: 409 });
  });

  it('rejects invalid email', async () => {
    const store = new InMemoryUserStore();
    await expect(
      registerUser(store, { email: 'not-an-email', password: 'password123' }),
    ).rejects.toBeInstanceOf(AuthError);
  });

  it('rejects short password', async () => {
    const store = new InMemoryUserStore();
    await expect(
      registerUser(store, { email: 'a@b.co', password: 'short' }),
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe('loginUser', () => {
  it('returns the user for valid credentials', async () => {
    const store = new InMemoryUserStore();
    const registered = await registerUser(store, {
      email: 'learner@example.com',
      password: 'password123',
    });

    const user = await loginUser(store, {
      email: 'learner@example.com',
      password: 'password123',
    });

    expect(user).toEqual(registered);
  });

  it('rejects wrong password', async () => {
    const store = new InMemoryUserStore();
    await registerUser(store, { email: 'learner@example.com', password: 'password123' });

    await expect(
      loginUser(store, { email: 'learner@example.com', password: 'wrongpass1' }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('rejects unknown email', async () => {
    const store = new InMemoryUserStore();
    await expect(
      loginUser(store, { email: 'missing@example.com', password: 'password123' }),
    ).rejects.toMatchObject({ status: 401 });
  });
});

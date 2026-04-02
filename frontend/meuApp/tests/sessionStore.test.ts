import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = new Map<string, string>();

vi.mock('@react-native-async-storage/async-storage', () => {
  return {
    default: {
      async setItem(key: string, value: string) {
        storage.set(key, value);
      },
      async getItem(key: string) {
        return storage.has(key) ? storage.get(key) ?? null : null;
      },
      async removeItem(key: string) {
        storage.delete(key);
      },
    },
  };
});

describe('sessionStore', () => {
  beforeEach(async () => {
    storage.clear();
    const sessionStore = await import('../lib/sessionStore');
    await sessionStore.clearCurrentSession();
  });

  it('stores and loads valid sessions', async () => {
    const sessionStore = await import('../lib/sessionStore');

    const session = {
      token: 'token-123',
      user: {
        id: 1,
        name: 'Lucas',
        email: 'lucas@example.com',
        cpf: '12345678901',
        friendCode: '12345',
      },
    };

    await sessionStore.setCurrentSession(session);

    expect(sessionStore.getCurrentUser()).toEqual(session.user);
    expect(sessionStore.getAccessToken()).toBe('token-123');
    await expect(sessionStore.loadCurrentSession()).resolves.toEqual(session);
  });

  it('clears invalid persisted sessions', async () => {
    storage.set('neuroxp.session', JSON.stringify({ token: '', user: { id: 'x' } }));

    const sessionStore = await import('../lib/sessionStore');

    await expect(sessionStore.loadCurrentSession()).resolves.toBeNull();
    expect(storage.has('neuroxp.session')).toBe(false);
  });
});
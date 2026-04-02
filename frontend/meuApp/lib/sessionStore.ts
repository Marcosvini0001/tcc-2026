import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiSession, ApiUser } from './contracts';

let currentSession: ApiSession | null = null;
const SESSION_KEY = 'neuroxp.session';

function normalizeUser(value: unknown): ApiUser | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Partial<ApiUser> & { id?: number | string };
  const parsedId = typeof raw.id === 'string' ? Number(raw.id) : raw.id;

  if (
    typeof parsedId !== 'number' ||
    Number.isNaN(parsedId) ||
    typeof raw.name !== 'string' ||
    typeof raw.email !== 'string' ||
    typeof raw.cpf !== 'string' ||
    typeof raw.friendCode !== 'string'
  ) {
    return null;
  }

  return {
    id: parsedId,
    name: raw.name,
    email: raw.email,
    cpf: raw.cpf,
    friendCode: raw.friendCode,
  };
}

function normalizeSession(value: unknown): ApiSession | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as Partial<ApiSession> & { user?: unknown; token?: unknown };
  const normalizedUser = normalizeUser(raw.user);

  if (!normalizedUser || typeof raw.token !== 'string' || !raw.token.trim()) {
    return null;
  }

  return {
    token: raw.token,
    user: normalizedUser,
  };
}

export async function setCurrentSession(session: ApiSession) {
  const normalized = normalizeSession(session);
  if (!normalized) {
    throw new Error('Sessao invalida');
  }

  currentSession = normalized;
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
}

export function getCurrentSession(): ApiSession | null {
  return currentSession;
}

export function getCurrentUser(): ApiUser | null {
  return currentSession?.user ?? null;
}

export function getAccessToken(): string | null {
  return currentSession?.token ?? null;
}

export async function loadCurrentSession(): Promise<ApiSession | null> {
  if (currentSession) {
    return currentSession;
  }

  const storedSession = await AsyncStorage.getItem(SESSION_KEY);
  if (!storedSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedSession) as unknown;
    const normalized = normalizeSession(parsed);
    if (!normalized) {
      await AsyncStorage.removeItem(SESSION_KEY);
      currentSession = null;
      return null;
    }

    currentSession = normalized;
    return normalized;
  } catch (_error) {
    await AsyncStorage.removeItem(SESSION_KEY);
    currentSession = null;
    return null;
  }
}

export async function loadCurrentUser(): Promise<ApiUser | null> {
  const session = await loadCurrentSession();
  return session?.user ?? null;
}

export async function clearCurrentSession() {
  currentSession = null;
  await AsyncStorage.removeItem(SESSION_KEY);
}

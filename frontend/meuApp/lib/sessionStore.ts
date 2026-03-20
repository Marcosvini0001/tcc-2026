import type { ApiUser } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

let currentUser: ApiUser | null = null;
const SESSION_KEY = 'neuroxp.currentUser';

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

export async function setCurrentUser(user: ApiUser) {
  const normalized = normalizeUser(user);
  if (!normalized) {
    throw new Error('Sessao invalida');
  }

  currentUser = normalized;
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
}

export function getCurrentUser(): ApiUser | null {
  return currentUser;
}

export async function loadCurrentUser(): Promise<ApiUser | null> {
  if (currentUser) {
    return currentUser;
  }

  const storedUser = await AsyncStorage.getItem(SESSION_KEY);
  if (!storedUser) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedUser) as unknown;
    const normalized = normalizeUser(parsed);
    if (!normalized) {
      await AsyncStorage.removeItem(SESSION_KEY);
      currentUser = null;
      return null;
    }

    currentUser = normalized;
    return normalized;
  } catch (_error) {
    await AsyncStorage.removeItem(SESSION_KEY);
    currentUser = null;
    return null;
  }
}

export async function clearCurrentUser() {
  currentUser = null;
  await AsyncStorage.removeItem(SESSION_KEY);
}

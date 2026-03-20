import type { ApiUser } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

let currentUser: ApiUser | null = null;
const SESSION_KEY = 'neuroxp.currentUser';

export async function setCurrentUser(user: ApiUser) {
  currentUser = user;
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(user));
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
    currentUser = JSON.parse(storedUser) as ApiUser;
    return currentUser;
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

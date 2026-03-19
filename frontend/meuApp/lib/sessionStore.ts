import type { ApiUser } from './api';

let currentUser: ApiUser | null = null;

export function setCurrentUser(user: ApiUser) {
  currentUser = user;
}

export function getCurrentUser(): ApiUser | null {
  return currentUser;
}

export function clearCurrentUser() {
  currentUser = null;
}

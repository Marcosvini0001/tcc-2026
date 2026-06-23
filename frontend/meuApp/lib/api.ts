import { Platform } from 'react-native';
import { clearCurrentSession, getAccessToken } from './sessionStore';
import type { ApiFriendRequest, ApiSession, ApiUser } from './contracts';

export type { ApiFriendRequest, ApiSession, ApiUser } from './contracts';

export interface ForgotPasswordResponse {
  message: string;
  resetTokenPreview?: string;
  expiresAt?: string;
}

export interface ApiProgressStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  taskPoints: number;
  friendBonusPoints: number;
  points: number;
  level: number;
  nextLevelAt: number;
  pointsToNextLevel: number;
  progressPercent: number;
}

export interface ApiUserProfile extends ApiUser, ApiProgressStats {
  friendsCount: number;
}

export interface ApiRankingUser extends ApiProgressStats {
  id: number;
  name: string;
  friendsCount: number;
  rank: number;
}

export interface ApiTask {
  id: number;
  userId: number;
  activity: string;
  description: string | null;
  photoUrl: string | null;
  points: number;
  completed: boolean;
  analysis?: string | null;
  scheduledFor?: string | null;
}

const getBaseUrl = () => {
  const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
};

const API_BASE_URL = getBaseUrl();

const ensureValidUserId = (userId: number) => {
  if (typeof userId !== 'number' || Number.isNaN(userId)) {
    throw new Error('Usuario invalido');
  }
};

const buildHeaders = (headers?: HeadersInit, includeJsonContentType = true) => {
  const requestHeaders = new Headers(headers);

  if (includeJsonContentType && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const accessToken = getAccessToken();
  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  return requestHeaders;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: buildHeaders(options?.headers),
    ...options,
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const data = (await response.json()) as { message?: string };
      message = data.message ?? message;
    } catch (_error) {
      // Keep default error message when body is not JSON.
    }

    if (response.status === 401) {
      await clearCurrentSession();
    }

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function apiRegisterUser(payload: {
  name: string;
  email: string;
  password: string;
  cpf: string;
}): Promise<ApiSession> {
  return request<ApiSession>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiLogin(payload: { email: string; password: string }): Promise<ApiSession> {
  return request<ApiSession>('/users/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiForgotPassword(email: string): Promise<ForgotPasswordResponse> {
  return request<ForgotPasswordResponse>('/users/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function apiResetPassword(payload: { token: string; newPassword: string }) {
  return request<{ message: string }>('/users/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiGetUserById(userId: number): Promise<ApiUserProfile> {
  ensureValidUserId(userId);
  return request<ApiUserProfile>(`/users/${userId}`);
}

export async function apiAddFriendByCode(
  userId: number,
  friendCode: string
): Promise<{ friend: ApiUser; status: 'pending' | 'accepted'; message: string }> {
  ensureValidUserId(userId);
  const result = await request<{ friend: ApiUser; status: 'pending' | 'accepted'; message: string }>(`/users/${userId}/friends`, {
    method: 'POST',
    body: JSON.stringify({ friendCode }),
  });

  return result;
}

export async function apiGetFriends(userId: number): Promise<ApiUser[]> {
  ensureValidUserId(userId);
  return request<ApiUser[]>(`/users/${userId}/friends`);
}

export async function apiGetPendingFriendRequests(userId: number): Promise<ApiFriendRequest[]> {
  ensureValidUserId(userId);
  return request<ApiFriendRequest[]>(`/users/${userId}/friend-requests`);
}

export async function apiAcceptFriendRequest(userId: number, requestId: number): Promise<{ friend: ApiUser | null; message: string }> {
  ensureValidUserId(userId);
  return request<{ friend: ApiUser | null; message: string }>(`/users/${userId}/friend-requests/${requestId}/accept`, {
    method: 'PATCH',
  });
}

export async function apiRejectFriendRequest(userId: number, requestId: number): Promise<{ message: string }> {
  ensureValidUserId(userId);
  return request<{ message: string }>(`/users/${userId}/friend-requests/${requestId}`, {
    method: 'DELETE',
  });
}

export async function apiRemoveFriend(userId: number, friendId: number): Promise<void> {
  ensureValidUserId(userId);
  await request<{ message: string }>(`/users/${userId}/friends/${friendId}`, {
    method: 'DELETE',
  });
}

export async function apiGetRanking(): Promise<ApiRankingUser[]> {
  return request<ApiRankingUser[]>('/users/ranking');
}

export async function apiCreateTask(
  userId: number,
  payload: { activity: string; description?: string; scheduledFor?: string }
): Promise<ApiTask> {
  ensureValidUserId(userId);
  return request<ApiTask>(`/users/${userId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiGetTasks(userId: number): Promise<ApiTask[]> {
  ensureValidUserId(userId);
  return request<ApiTask[]>(`/users/${userId}/tasks`);
}

export async function apiCompleteTask(userId: number, taskId: number): Promise<ApiTask> {
  ensureValidUserId(userId);
  return request<ApiTask>(`/users/${userId}/tasks/${taskId}/complete`, {
    method: 'PATCH',
  });
}


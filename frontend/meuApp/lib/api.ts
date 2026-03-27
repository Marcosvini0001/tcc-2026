import { Platform } from 'react-native';

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  cpf: string;
  friendCode: string;
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
  photoUrl: string | null;
  points: number;
  completed: boolean;
  analysis?: string | null;
  scheduledFor?: string | null;
}

const getBaseUrl = () => {
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

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
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

    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function apiRegisterUser(payload: {
  name: string;
  email: string;
  password: string;
  cpf: string;
}): Promise<ApiUser> {
  return request<ApiUser>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiLogin(payload: { email: string; password: string }): Promise<ApiUser> {
  return request<ApiUser>('/users/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiGetUserById(userId: number): Promise<ApiUserProfile> {
  ensureValidUserId(userId);
  return request<ApiUserProfile>(`/users/${userId}`);
}

export async function apiAddFriendByCode(userId: number, friendCode: string): Promise<ApiUser> {
  ensureValidUserId(userId);
  const result = await request<{ friend: ApiUser }>(`/users/${userId}/friends`, {
    method: 'POST',
    body: JSON.stringify({ friendCode }),
  });

  return result.friend;
}

export async function apiGetFriends(userId: number): Promise<ApiUser[]> {
  ensureValidUserId(userId);
  return request<ApiUser[]>(`/users/${userId}/friends`);
}

export async function apiGetRanking(): Promise<ApiRankingUser[]> {
  return request<ApiRankingUser[]>('/users/ranking');
}

export async function apiCreateTask(
  userId: number,
  payload: { photoUrl?: string; activity: string; scheduledFor?: string }
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

export async function apiUploadTaskPhoto(
  userId: number,
  uri: string,
  activity: string,
  scheduledFor?: string
): Promise<ApiTask> {
  ensureValidUserId(userId);
  const formData = new FormData();
  const extension = uri.split('.').pop()?.toLowerCase();
  const type = extension === 'png' ? 'image/png' : 'image/jpeg';

  formData.append('photo', {
    uri,
    name: `task-${Date.now()}.${extension || 'jpg'}`,
    type,
  } as any);
  formData.append('activity', activity);
  if (scheduledFor) {
    formData.append('scheduledFor', scheduledFor);
  }

  const response = await fetch(`${API_BASE_URL}/users/${userId}/tasks/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let message = 'Upload failed';
    try {
      const data = (await response.json()) as { message?: string };
      message = data.message ?? message;
    } catch (_error) {
      // Keep default message.
    }

    throw new Error(message);
  }

  return (await response.json()) as ApiTask;
}

export async function apiAnalyzeTaskPhoto(userId: number, taskId: number): Promise<ApiTask> {
  ensureValidUserId(userId);
  const result = await request<{ task: ApiTask }>(`/users/${userId}/tasks/${taskId}/analyze`, {
    method: 'POST',
  });

  return result.task;
}

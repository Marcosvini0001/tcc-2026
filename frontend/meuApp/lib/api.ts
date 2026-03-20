import { Platform } from 'react-native';

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  cpf: string;
  friendCode: string;
}

export interface ApiRankingUser {
  id: number;
  name: string;
  friendsCount: number;
  points: number;
  level: number;
  rank: number;
}

export interface ApiTask {
  id: number;
  userId: number;
  photoUrl: string;
  completed: boolean;
  analysis?: string | null;
}

const getBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
};

const API_BASE_URL = getBaseUrl();

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

export async function apiAddFriendByCode(userId: number, friendCode: string): Promise<ApiUser> {
  const result = await request<{ friend: ApiUser }>(`/users/${userId}/friends`, {
    method: 'POST',
    body: JSON.stringify({ friendCode }),
  });

  return result.friend;
}

export async function apiGetFriends(userId: number): Promise<ApiUser[]> {
  return request<ApiUser[]>(`/users/${userId}/friends`);
}

export async function apiGetRanking(): Promise<ApiRankingUser[]> {
  return request<ApiRankingUser[]>('/users/ranking');
}

export async function apiCreateTask(userId: number, photoUrl: string): Promise<ApiTask> {
  return request<ApiTask>(`/users/${userId}/tasks`, {
    method: 'POST',
    body: JSON.stringify({ photoUrl }),
  });
}

export async function apiGetTasks(userId: number): Promise<ApiTask[]> {
  return request<ApiTask[]>(`/users/${userId}/tasks`);
}

export async function apiCompleteTask(userId: number, taskId: number): Promise<ApiTask> {
  return request<ApiTask>(`/users/${userId}/tasks/${taskId}/complete`, {
    method: 'PATCH',
  });
}

export async function apiUploadTaskPhoto(userId: number, uri: string): Promise<ApiTask> {
  const formData = new FormData();
  const extension = uri.split('.').pop()?.toLowerCase();
  const type = extension === 'png' ? 'image/png' : 'image/jpeg';

  formData.append('photo', {
    uri,
    name: `task-${Date.now()}.${extension || 'jpg'}`,
    type,
  } as any);

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
  const result = await request<{ task: ApiTask }>(`/users/${userId}/tasks/${taskId}/analyze`, {
    method: 'POST',
  });

  return result.task;
}

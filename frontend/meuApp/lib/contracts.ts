export interface ApiUser {
  id: number;
  name: string;
  email: string;
  cpf: string;
  friendCode: string;
}

export interface ApiSession {
  token: string;
  user: ApiUser;
}

export interface ApiFriendRequest {
  requestId: number;
  status: 'pending' | 'accepted';
  createdAt: string;
  requester: ApiUser;
}
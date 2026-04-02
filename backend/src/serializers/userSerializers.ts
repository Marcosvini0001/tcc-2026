import type Adm from '../models/admModels';
import type User from '../models/userModels';

export const sanitizeUser = (user: User) => {
  const raw = user.toJSON() as Record<string, unknown>;

  return {
    id: Number(raw.id),
    name: String(raw.name ?? ''),
    email: String(raw.email ?? ''),
    cpf: String(raw.cpf ?? ''),
    friendCode: String(raw.friendCode ?? ''),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};

export const sanitizeAdmin = (admin: Adm) => {
  const raw = admin.toJSON() as Record<string, unknown>;

  return {
    id: Number(raw.id),
    name: String(raw.name ?? ''),
    email: String(raw.email ?? ''),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};
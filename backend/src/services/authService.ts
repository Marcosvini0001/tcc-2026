import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export type AuthRole = 'user' | 'admin';

export type AuthContext = {
  userId: number;
  role: AuthRole;
};

const PASSWORD_MIN_LENGTH = 8;
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';
const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

export const validatePasswordStrength = (password: string) => {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return 'A senha deve ter no minimo 8 caracteres';
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSymbol) {
    return 'A senha deve incluir letras maiusculas, minusculas, numeros e simbolos';
  }

  return null;
};

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
};

export const verifyPassword = async (password: string, passwordHash: string) => {
  return bcrypt.compare(password, passwordHash);
};

export const createAccessToken = (context: AuthContext) => {
  return jwt.sign({ role: context.role }, JWT_SECRET, {
    subject: String(context.userId),
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};

export const verifyAccessToken = (token: string): AuthContext => {
  const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & { role?: AuthRole };
  const userId = Number(payload.sub);

  if (Number.isNaN(userId)) {
    throw new Error('Invalid token subject');
  }

  if (payload.role !== 'user' && payload.role !== 'admin') {
    throw new Error('Invalid token role');
  }

  return {
    userId,
    role: payload.role,
  };
};
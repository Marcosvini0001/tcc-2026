import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export type AuthRole = 'user' | 'admin';

export type AuthContext = {
  userId: number;
  role: AuthRole;
};

/**
 * Configurações de autenticação e segurança.
 * Estas variáveis controlam força da senha e validade dos tokens JWT.
 */
const PASSWORD_MIN_LENGTH = 8;
const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';
const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

/**
 * Valida a qualidade da senha fornecida pelo usuário.
 * Retorna mensagem de erro se a senha não cumpriu os requisitos mínimos.
 */
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

/**
 * Gera o hash seguro da senha do usuário antes de persistir no banco.
 */
export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
};

/**
 * Compara a senha fornecida com o hash armazenado no banco.
 */
export const verifyPassword = async (password: string, passwordHash: string) => {
  return bcrypt.compare(password, passwordHash);
};

/**
 * Cria um token JWT para autenticação do usuário.
 * O token carrega o papel (user/admin) e o id do usuário no subject.
 */
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
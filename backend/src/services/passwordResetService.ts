import crypto from 'node:crypto';

/**
 * Define o tempo de vida do token de redefinição de senha em minutos.
 */
const RESET_TOKEN_TTL_MINUTES = Number(process.env.RESET_TOKEN_TTL_MINUTES || 15);

/**
 * Gera um token de redefinição de senha e o hash para armazenar no banco.
 * O token em texto é enviado ao usuário, o hash é guardado para validação.
 */
export const createPasswordResetToken = () => {
  const token = crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000);

  return {
    token,
    tokenHash,
    expiresAt,
  };
};

/**
 * Calcula o hash SHA-256 do token de redefinição para comparação segura.
 */
export const hashPasswordResetToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const isPasswordResetExpired = (expiresAt: Date | null) => {
  if (!expiresAt) {
    return true;
  }

  return expiresAt.getTime() < Date.now();
};
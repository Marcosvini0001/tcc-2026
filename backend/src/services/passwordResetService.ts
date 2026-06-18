import crypto from 'node:crypto';

const RESET_TOKEN_TTL_MINUTES = Number(process.env.RESET_TOKEN_TTL_MINUTES || 15);

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

export const hashPasswordResetToken = (token: string) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const isPasswordResetExpired = (expiresAt: Date | null) => {
  if (!expiresAt) {
    return true;
  }

  return expiresAt.getTime() < Date.now();
};
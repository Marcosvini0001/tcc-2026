import { describe, expect, it } from 'vitest';
import {
  createAccessToken,
  hashPassword,
  validatePasswordStrength,
  verifyAccessToken,
  verifyPassword,
} from '../src/services/authService';
import {
  createPasswordResetToken,
  hashPasswordResetToken,
  isPasswordResetExpired,
} from '../src/services/passwordResetService';

describe('authService', () => {
  it('rejects weak passwords', () => {
    expect(validatePasswordStrength('abc123')).toBeTruthy();
    expect(validatePasswordStrength('Senha123!')).toBeNull();
  });

  it('hashes and verifies passwords', async () => {
    const passwordHash = await hashPassword('Senha123!');

    expect(passwordHash).not.toBe('Senha123!');
    await expect(verifyPassword('Senha123!', passwordHash)).resolves.toBe(true);
    await expect(verifyPassword('Outra123!', passwordHash)).resolves.toBe(false);
  });

  it('creates and validates access tokens', () => {
    const token = createAccessToken({ userId: 42, role: 'user' });

    expect(verifyAccessToken(token)).toEqual({ userId: 42, role: 'user' });
  });

  it('creates password reset tokens with hash and expiry', () => {
    const reset = createPasswordResetToken();

    expect(reset.token).toHaveLength(48);
    expect(hashPasswordResetToken(reset.token)).toBe(reset.tokenHash);
    expect(isPasswordResetExpired(reset.expiresAt)).toBe(false);
  });
});
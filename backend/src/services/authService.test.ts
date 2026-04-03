import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import {
  createAccessToken,
  hashPassword,
  validatePasswordStrength,
  verifyAccessToken,
  verifyPassword,
} from './authService';

describe('authService', () => {
  it('valida senhas fracas e aceita senha forte', () => {
    expect(validatePasswordStrength('Ab1!')).toBe('A senha deve ter no minimo 8 caracteres');
    expect(validatePasswordStrength('abcdefgh')).toBe(
      'A senha deve incluir letras maiusculas, minusculas, numeros e simbolos'
    );
    expect(validatePasswordStrength('Senha123!')).toBeNull();
  });

  it('gera hash e valida a senha corretamente', async () => {
    const passwordHash = await hashPassword('Senha123!');

    expect(passwordHash).not.toBe('Senha123!');
    await expect(verifyPassword('Senha123!', passwordHash)).resolves.toBe(true);
    await expect(verifyPassword('Senha123?', passwordHash)).resolves.toBe(false);
  });

  it('gera e verifica token de acesso', () => {
    const token = createAccessToken({ userId: 42, role: 'user' });

    expect(verifyAccessToken(token)).toEqual({
      userId: 42,
      role: 'user',
    });
  });

  it('rejeita token com role invalida', () => {
    const token = jwt.sign({ role: 'guest' }, process.env.JWT_SECRET || 'development-secret-change-me', {
      subject: '42',
      expiresIn: '1h',
    });

    expect(() => verifyAccessToken(token)).toThrow('Invalid token role');
  });

  it('rejeita token com subject invalido', () => {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'development-secret-change-me', {
      subject: 'abc',
      expiresIn: '1h',
    });

    expect(() => verifyAccessToken(token)).toThrow('Invalid token subject');
  });
});
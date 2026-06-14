import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import {
  createAccessToken,
  hashPassword,
  validatePasswordStrength,
  verifyAccessToken,
  verifyPassword,
} from './authService';

describe('authService - Password Validation', () => {
  it('deve rejeitar senha com menos de 8 caracteres', () => {
    // Arrange
    const weakPassword = 'Ab1!';

    // Act
    const result = validatePasswordStrength(weakPassword);

    // Assert
    expect(result).toBe('A senha deve ter no minimo 8 caracteres');
  });

  it('deve rejeitar senha sem caracteres especiais, maiúsculas ou números', () => {
    // Arrange
    const weakPassword = 'abcdefgh';

    // Act
    const result = validatePasswordStrength(weakPassword);

    // Assert
    expect(result).toBe(
      'A senha deve incluir letras maiusculas, minusculas, numeros e simbolos'
    );
  });

  it('deve aceitar senha com todos os requisitos', () => {
    // Arrange
    const strongPassword = 'Senha123!';

    // Act
    const result = validatePasswordStrength(strongPassword);

    // Assert
    expect(result).toBeNull();
  });
});

describe('authService - Password Hashing', () => {
  it('deve gerar hash diferente da senha original', async () => {
    // Arrange
    const password = 'Senha123!';

    // Act
    const passwordHash = await hashPassword(password);

    // Assert
    expect(passwordHash).not.toBe(password);
  });

  it('deve validar senha correta contra hash', async () => {
    // Arrange
    const password = 'Senha123!';
    const passwordHash = await hashPassword(password);

    // Act
    const isValid = await verifyPassword(password, passwordHash);

    // Assert
    expect(isValid).toBe(true);
  });

  it('deve rejeitar senha incorreta contra hash', async () => {
    // Arrange
    const correctPassword = 'Senha123!';
    const wrongPassword = 'Senha123?';
    const passwordHash = await hashPassword(correctPassword);

    // Act
    const isValid = await verifyPassword(wrongPassword, passwordHash);

    // Assert
    expect(isValid).toBe(false);
  });
});

describe('authService - Token Generation', () => {
  it('deve criar token com dados corretos', () => {
    // Arrange
    const payload = { userId: 42, role: 'user' };

    // Act
    const token = createAccessToken(payload);

    // Assert
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('deve gerar token que pode ser verificado', () => {
    // Arrange
    const userId = 42;
    const role = 'user';

    // Act
    const token = createAccessToken({ userId, role });
    const decoded = verifyAccessToken(token);

    // Assert
    expect(decoded.userId).toBe(userId);
    expect(decoded.role).toBe(role);
  });
});

describe('authService - Token Verification', () => {
  it('deve rejeitar token com role inválida', () => {
    // Arrange
    const invalidToken = jwt.sign(
      { role: 'guest' },
      process.env.JWT_SECRET || 'development-secret-change-me',
      {
        subject: '42',
        expiresIn: '1h',
      }
    );

    // Act & Assert
    expect(() => verifyAccessToken(invalidToken)).toThrow('Invalid token role');
  });

  it('deve rejeitar token com subject (userId) inválido', () => {
    // Arrange
    const invalidToken = jwt.sign(
      { role: 'admin' },
      process.env.JWT_SECRET || 'development-secret-change-me',
      {
        subject: 'abc',
        expiresIn: '1h',
      }
    );

    // Act & Assert
    expect(() => verifyAccessToken(invalidToken)).toThrow('Invalid token subject');
  });

  it('deve rejeitar token expirado', () => {
    // Arrange
    const expiredToken = jwt.sign(
      { role: 'user' },
      process.env.JWT_SECRET || 'development-secret-change-me',
      {
        subject: '42',
        expiresIn: '-1h', // Expirado há 1 hora
      }
    );

    // Act & Assert
    expect(() => verifyAccessToken(expiredToken)).toThrow();
  });
});
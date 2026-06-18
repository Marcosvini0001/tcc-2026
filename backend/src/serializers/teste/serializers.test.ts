import { describe, expect, it } from 'vitest';
import { sanitizeUser } from '../userSerializers';
import { sanitizeTask } from '../taskSerializers';

describe('Serializers', () => {
  describe('sanitizeUser', () => {
    it('should return user object with safe fields', () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
        cpf: '12345678901',
        friendCode: '12345',
        createdAt: new Date(),
        updatedAt: new Date(),
        toJSON: function() { return this; }
      };

      const result = sanitizeUser(mockUser as any);

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('name', 'Test User');
      expect(result).toHaveProperty('email', 'test@test.com');
      expect(result).toHaveProperty('cpf', '12345678901');
      expect(result).toHaveProperty('friendCode', '12345');
    });

    it('should not include password in sanitized user', () => {
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
        password: 'hashed_password',
        cpf: '12345678901',
        friendCode: '12345',
        createdAt: new Date(),
        updatedAt: new Date(),
        toJSON: function() { return this; }
      };

      const result = sanitizeUser(mockUser as any);

      expect(result).not.toHaveProperty('password');
    });

    it('should include timestamps', () => {
      const now = new Date();
      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@test.com',
        cpf: '12345678901',
        friendCode: '12345',
        createdAt: now,
        updatedAt: now,
        toJSON: function() { return this; }
      };

      const result = sanitizeUser(mockUser as any);

      expect(result).toHaveProperty('createdAt', now);
      expect(result).toHaveProperty('updatedAt', now);
    });
  });

  describe('sanitizeTask', () => {
    it('should return task object with all fields', () => {
      const mockTask = {
        id: 1,
        userId: 1,
        activity: 'Test Activity',
        description: 'Test Description',
        points: 5,
        completed: false,
        analysis: null,
        scheduledFor: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        toJSON: function() { return this; }
      };

      const result = sanitizeTask(mockTask as any);

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('userId', 1);
      expect(result).toHaveProperty('activity', 'Test Activity');
      expect(result).toHaveProperty('description', 'Test Description');
      expect(result).toHaveProperty('points', 5);
      expect(result).toHaveProperty('completed', false);
    });

    it('should coerce values to correct types', () => {
      const mockTask = {
        id: '1',
        userId: '1',
        activity: 'Test',
        description: null,
        points: '5',
        completed: 0,
        analysis: null,
        scheduledFor: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        toJSON: function() { return this; }
      };

      const result = sanitizeTask(mockTask as any);

      expect(typeof result.id).toBe('number');
      expect(typeof result.userId).toBe('number');
      expect(typeof result.points).toBe('number');
      expect(typeof result.completed).toBe('boolean');
    });

    it('should handle null values for optional fields', () => {
      const mockTask = {
        id: 1,
        userId: 1,
        activity: 'Test',
        description: null,
        points: 5,
        completed: false,
        analysis: null,
        scheduledFor: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        toJSON: function() { return this; }
      };

      const result = sanitizeTask(mockTask as any);

      expect(result.description).toBeNull();
      expect(result.analysis).toBeNull();
      expect(result.scheduledFor).toBeNull();
    });
  });
});

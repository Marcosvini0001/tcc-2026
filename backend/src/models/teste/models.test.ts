import { describe, expect, it } from 'vitest';
import User from '../userModels';
import Task from '../taskModels';
import UserFriend from '../userFriendModels';
import Adm from '../admModels';

describe('Models - Database Schema', () => {
  describe('User Model', () => {
    it('should have all required attributes', () => {
      const userAttributes = Object.keys(User.rawAttributes);
      expect(userAttributes).toContain('id');
      expect(userAttributes).toContain('name');
      expect(userAttributes).toContain('email');
      expect(userAttributes).toContain('password');
      expect(userAttributes).toContain('cpf');
      expect(userAttributes).toContain('friendCode');
    });

    it('email should be unique', () => {
      const emailAttribute = User.rawAttributes.email;
      expect(emailAttribute.unique).toBe(true);
    });

    it('cpf should be unique', () => {
      const cpfAttribute = User.rawAttributes.cpf;
      expect(cpfAttribute.unique).toBe(true);
    });

    it('friendCode should be unique', () => {
      const friendCodeAttribute = User.rawAttributes.friendCode;
      expect(friendCodeAttribute.unique).toBe(true);
    });
  });

  describe('Task Model', () => {
    it('should have all required attributes', () => {
      const taskAttributes = Object.keys(Task.rawAttributes);
      expect(taskAttributes).toContain('id');
      expect(taskAttributes).toContain('userId');
      expect(taskAttributes).toContain('activity');
      expect(taskAttributes).toContain('description');
      expect(taskAttributes).toContain('points');
      expect(taskAttributes).toContain('completed');
    });

    it('userId should reference User', () => {
      const userIdAttribute = Task.rawAttributes.userId;
      expect(userIdAttribute.references).toBeDefined();
      expect(userIdAttribute.references.model).toBe('users');
    });

    it('completed should default to false', () => {
      const completedAttribute = Task.rawAttributes.completed;
      expect(completedAttribute.defaultValue).toBe(false);
    });

    it('description should be nullable', () => {
      const descriptionAttribute = Task.rawAttributes.description;
      expect(descriptionAttribute.allowNull).toBe(true);
    });
  });

  describe('UserFriend Model', () => {
    it('should have userId and friendId', () => {
      const attributes = Object.keys(UserFriend.rawAttributes);
      expect(attributes).toContain('userId');
      expect(attributes).toContain('friendId');
    });

    it('should have unique constraint on userId and friendId', () => {
      const userIdAttribute = UserFriend.rawAttributes.userId;
      expect(userIdAttribute.references).toBeDefined();
    });
  });

  describe('Adm Model', () => {
    it('should have all required attributes', () => {
      const admAttributes = Object.keys(Adm.rawAttributes);
      expect(admAttributes).toContain('id');
      expect(admAttributes).toContain('name');
      expect(admAttributes).toContain('email');
      expect(admAttributes).toContain('password');
    });

    it('email should be unique', () => {
      const emailAttribute = Adm.rawAttributes.email;
      expect(emailAttribute.unique).toBe(true);
    });
  });
});

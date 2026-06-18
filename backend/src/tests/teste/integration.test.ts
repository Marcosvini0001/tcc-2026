import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import sequelize from '../../config/database';
import User from '../../models/userModels';
import Task from '../../models/taskModels';
import UserFriend from '../../models/userFriendModels';
import Adm from '../../models/admModels';
import { UserFactory, TaskFactory, UserFriendFactory } from '../factories';
import { ApiTestHelper, RequestBuilder, AssertionHelper } from '../helpers';

// Mock do app para testes
let app: ReturnType<typeof express>;

describe('User CRUD Integration Tests', () => {
  beforeEach(async () => {
    // Sincronizar banco de dados para testes
    await sequelize.sync({ force: true });
    
    // Criar app simples para testes
    app = express();
    app.use(express.json());
  });

  afterEach(async () => {
    // Limpar dados após cada teste
    await UserFriend.destroy({ where: {} });
    await Task.destroy({ where: {} });
    await Adm.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  describe('CREATE', () => {
    it('deve criar um novo usuário com dados válidos', async () => {
      // Arrange
      const userData = {
        name: 'João Silva',
        email: 'joao@example.com',
        password: 'ValidPassword123!',
        cpf: '12345678901',
      };

      // Act
      const createdUser = await UserFactory.create({
        name: userData.name,
        email: userData.email,
        cpf: userData.cpf,
      });

      // Assert
      AssertionHelper.assertNotNull(createdUser.id, 'user id');
      expect(createdUser.name).toBe(userData.name);
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.cpf).toBe(userData.cpf);
      AssertionHelper.assertHasFields(createdUser, ['name', 'email', 'cpf', 'friendCode']);
    });

    it('deve gerar friend code único para cada usuário', async () => {
      // Arrange & Act
      const user1 = await UserFactory.create();
      const user2 = await UserFactory.create();

      // Assert
      AssertionHelper.assertNotNull(user1.friendCode, 'user1 friendCode');
      AssertionHelper.assertNotNull(user2.friendCode, 'user2 friendCode');
      expect(user1.friendCode).not.toBe(user2.friendCode);
    });

    it('deve criar múltiplos usuários com createMany', async () => {
      // Arrange
      const count = 5;

      // Act
      const users = await UserFactory.createMany(count);

      // Assert
      AssertionHelper.assertArrayLength(users, count, 'users');
      users.forEach(user => {
        AssertionHelper.assertNotNull(user.id, 'user id');
        AssertionHelper.assertNotNull(user.email, 'user email');
      });
    });
  });

  describe('READ', () => {
    it('deve buscar usuário por ID', async () => {
      // Arrange
      const user = await UserFactory.create({ name: 'Maria Silva' });

      // Act
      const foundUser = await User.findByPk(user.id);

      // Assert
      AssertionHelper.assertNotNull(foundUser, 'found user');
      expect(foundUser!.name).toBe('Maria Silva');
      AssertionHelper.assertEqual(foundUser!.id, user.id, 'user id');
    });

    it('deve buscar usuário por email', async () => {
      // Arrange
      const userData = { email: 'teste@example.com' };
      const user = await UserFactory.create(userData);

      // Act
      const foundUser = await User.findOne({ where: { email: userData.email } });

      // Assert
      AssertionHelper.assertNotNull(foundUser, 'found user');
      expect(foundUser!.email).toBe(userData.email);
    });

    it('deve retornar nulo ao buscar usuário inexistente', async () => {
      // Arrange, Act, Assert
      const foundUser = await User.findByPk(9999);
      expect(foundUser).toBeNull();
    });

    it('deve buscar todos os usuários', async () => {
      // Arrange
      await UserFactory.createMany(3);

      // Act
      const users = await User.findAll();

      // Assert
      AssertionHelper.assertArrayLength(users, 3, 'users');
    });
  });

  describe('UPDATE', () => {
    it('deve atualizar nome do usuário', async () => {
      // Arrange
      const user = await UserFactory.create({ name: 'Nome Antigo' });
      const newName = 'Nome Novo';

      // Act
      await user.update({ name: newName });
      const updatedUser = await User.findByPk(user.id);

      // Assert
      expect(updatedUser!.name).toBe(newName);
    });

    it('deve atualizar token de reset de senha', async () => {
      // Arrange
      const user = await UserFactory.create();
      const tokenHash = 'abc123hash';
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Act
      await user.update({
        resetPasswordTokenHash: tokenHash,
        resetPasswordExpiresAt: expiresAt,
      });
      const updatedUser = await User.findByPk(user.id);

      // Assert
      expect(updatedUser!.resetPasswordTokenHash).toBe(tokenHash);
      AssertionHelper.assertNotNull(updatedUser!.resetPasswordExpiresAt, 'resetPasswordExpiresAt');
    });

    it('deve atualizar múltiplos campos simultaneamente', async () => {
      // Arrange
      const user = await UserFactory.create();
      const updates = {
        name: 'Novo Nome',
        cpf: '98765432100',
      };

      // Act
      await user.update(updates);
      const updatedUser = await User.findByPk(user.id);

      // Assert
      expect(updatedUser!.name).toBe(updates.name);
      expect(updatedUser!.cpf).toBe(updates.cpf);
    });
  });

  describe('DELETE', () => {
    it('deve deletar usuário por ID', async () => {
      // Arrange
      const user = await UserFactory.create();
      const userId = user.id;

      // Act
      await user.destroy();
      const deletedUser = await User.findByPk(userId);

      // Assert
      expect(deletedUser).toBeNull();
    });

    it('deve deletar cascata: usuário remove tarefas', async () => {
      // Arrange
      const user = await UserFactory.create();
      await TaskFactory.createMany(user.id, 3);
      const tasksBeforeDelete = await Task.findAll({ where: { userId: user.id } });
      AssertionHelper.assertArrayLength(tasksBeforeDelete, 3, 'tasks before delete');

      // Act
      await user.destroy();
      const tasksAfterDelete = await Task.findAll({ where: { userId: user.id } });

      // Assert
      AssertionHelper.assertArrayLength(tasksAfterDelete, 0, 'tasks after delete');
    });

    it('deve deletar múltiplos usuários', async () => {
      // Arrange
      const users = await UserFactory.createMany(3);
      const initialCount = await User.count();

      // Act
      await User.destroy({ where: {} });
      const finalCount = await User.count();

      // Assert
      expect(initialCount).toBe(3);
      expect(finalCount).toBe(0);
    });
  });
});

describe('Task CRUD Integration Tests', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await Task.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  describe('CREATE', () => {
    it('deve criar tarefa para usuário existente', async () => {
      // Arrange
      const user = await UserFactory.create();
      const taskData = {
        activity: 'Fazer exercício',
        points: 20,
        completed: false,
      };

      // Act
      const task = await TaskFactory.create(user.id, taskData);

      // Assert
      expect(task.userId).toBe(user.id);
      expect(task.activity).toBe(taskData.activity);
      expect(task.points).toBe(taskData.points);
      expect(task.completed).toBe(false);
    });

    it('deve criar múltiplas tarefas com createMany', async () => {
      // Arrange
      const user = await UserFactory.create();
      const count = 5;

      // Act
      const tasks = await TaskFactory.createMany(user.id, count);

      // Assert
      AssertionHelper.assertArrayLength(tasks, count, 'tasks');
      tasks.forEach(task => {
        expect(task.userId).toBe(user.id);
        AssertionHelper.assertNotNull(task.activity, 'activity');
      });
    });

    it('deve criar tarefa com status completo', async () => {
      // Arrange
      const user = await UserFactory.create();

      // Act
      const task = await TaskFactory.createCompleted(user.id);

      // Assert
      expect(task.completed).toBe(true);
      AssertionHelper.assertNotNull(task.analysis, 'analysis');
    });
  });

  describe('READ', () => {
    it('deve buscar tarefas por usuário', async () => {
      // Arrange
      const user = await UserFactory.create();
      await TaskFactory.createMany(user.id, 3);

      // Act
      const tasks = await Task.findAll({ where: { userId: user.id } });

      // Assert
      AssertionHelper.assertArrayLength(tasks, 3, 'tasks');
      tasks.forEach(task => {
        expect(task.userId).toBe(user.id);
      });
    });

    it('deve buscar tarefas completas', async () => {
      // Arrange
      const user = await UserFactory.create();
      await TaskFactory.create(user.id, { completed: false });
      await TaskFactory.createCompleted(user.id);
      await TaskFactory.createCompleted(user.id);

      // Act
      const completedTasks = await Task.findAll({
        where: { userId: user.id, completed: true },
      });

      // Assert
      AssertionHelper.assertArrayLength(completedTasks, 2, 'completed tasks');
      completedTasks.forEach(task => {
        expect(task.completed).toBe(true);
      });
    });

    it('deve buscar tarefas incompletas', async () => {
      // Arrange
      const user = await UserFactory.create();
      await TaskFactory.create(user.id, { completed: false });
      await TaskFactory.create(user.id, { completed: false });
      await TaskFactory.createCompleted(user.id);

      // Act
      const incompleteTasks = await Task.findAll({
        where: { userId: user.id, completed: false },
      });

      // Assert
      AssertionHelper.assertArrayLength(incompleteTasks, 2, 'incomplete tasks');
    });
  });

  describe('UPDATE', () => {
    it('deve marcar tarefa como concluída', async () => {
      // Arrange
      const user = await UserFactory.create();
      const task = await TaskFactory.create(user.id);

      // Act
      await task.update({
        completed: true,
        analysis: 'Tarefa completada com sucesso',
      });
      const updatedTask = await Task.findByPk(task.id);

      // Assert
      expect(updatedTask!.completed).toBe(true);
      expect(updatedTask!.analysis).toBe('Tarefa completada com sucesso');
    });

    it('deve atualizar pontos da tarefa', async () => {
      // Arrange
      const user = await UserFactory.create();
      const task = await TaskFactory.create(user.id, { points: 10 });

      // Act
      await task.update({ points: 25 });
      const updatedTask = await Task.findByPk(task.id);

      // Assert
      expect(updatedTask!.points).toBe(25);
    });

    it('deve atualizar descricao da tarefa', async () => {
      // Arrange
      const user = await UserFactory.create();
      const task = await TaskFactory.create(user.id, { activity: 'Atividade antiga' });

      // Act
      await task.update({ activity: 'Atividade nova' });
      const updatedTask = await Task.findByPk(task.id);

      // Assert
      expect(updatedTask!.activity).toBe('Atividade nova');
    });
  });

  describe('DELETE', () => {
    it('deve deletar tarefa por ID', async () => {
      // Arrange
      const user = await UserFactory.create();
      const task = await TaskFactory.create(user.id);
      const taskId = task.id;

      // Act
      await task.destroy();
      const deletedTask = await Task.findByPk(taskId);

      // Assert
      expect(deletedTask).toBeNull();
    });

    it('deve deletar todas as tarefas do usuário', async () => {
      // Arrange
      const user = await UserFactory.create();
      await TaskFactory.createMany(user.id, 3);

      // Act
      await Task.destroy({ where: { userId: user.id } });
      const remainingTasks = await Task.findAll({ where: { userId: user.id } });

      // Assert
      AssertionHelper.assertArrayLength(remainingTasks, 0, 'remaining tasks');
    });
  });
});

describe('UserFriend CRUD Integration Tests', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  afterEach(async () => {
    await UserFriend.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  describe('CREATE', () => {
    it('deve adicionar amizade entre dois usuários', async () => {
      // Arrange
      const user1 = await UserFactory.create();
      const user2 = await UserFactory.create();

      // Act
      const friendship = await UserFriendFactory.create(user1.id, user2.id);

      // Assert
      expect(friendship.userId).toBe(user1.id);
      expect(friendship.friendId).toBe(user2.id);
      AssertionHelper.assertNotNull(friendship.createdAt, 'createdAt');
    });

    it('deve criar múltiplas amizades com createMany', async () => {
      // Arrange
      const user = await UserFactory.create();
      const friends = await UserFactory.createMany(3);
      const friendIds = friends.map(f => f.id);

      // Act
      const friendships = await UserFriendFactory.createMany(user.id, friendIds);

      // Assert
      AssertionHelper.assertArrayLength(friendships, 3, 'friendships');
      friendships.forEach((friendship, index) => {
        expect(friendship.userId).toBe(user.id);
        expect(friendship.friendId).toBe(friendIds[index]);
      });
    });
  });

  describe('READ', () => {
    it('deve buscar amigos de um usuário', async () => {
      // Arrange
      const user = await UserFactory.create();
      const friends = await UserFactory.createMany(3);
      await UserFriendFactory.createMany(
        user.id,
        friends.map(f => f.id)
      );

      // Act
      const friendships = await UserFriend.findAll({ where: { userId: user.id } });

      // Assert
      AssertionHelper.assertArrayLength(friendships, 3, 'friendships');
    });

    it('deve verificar se dois usuários são amigos', async () => {
      // Arrange
      const user1 = await UserFactory.create();
      const user2 = await UserFactory.create();
      await UserFriendFactory.create(user1.id, user2.id);

      // Act
      const friendship = await UserFriend.findOne({
        where: { userId: user1.id, friendId: user2.id },
      });

      // Assert
      AssertionHelper.assertNotNull(friendship, 'friendship');
    });
  });

  describe('DELETE', () => {
    it('deve remover amizade entre usuários', async () => {
      // Arrange
      const user1 = await UserFactory.create();
      const user2 = await UserFactory.create();
      const friendship = await UserFriendFactory.create(user1.id, user2.id);

      // Act
      await friendship.destroy();
      const removedFriendship = await UserFriend.findByPk(friendship.id);

      // Assert
      expect(removedFriendship).toBeNull();
    });
  });
});

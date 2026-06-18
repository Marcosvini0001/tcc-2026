import { faker } from '@faker-js/faker';
import User from '../models/userModels';
import Task from '../models/taskModels';
import UserFriend from '../models/userFriendModels';
import Adm from '../models/admModels';
import bcryptjs from 'bcryptjs';

export class UserFactory {
  private static generateFriendCode(): string {
    return Math.random().toString(36).substring(2, 7).toUpperCase();
  }

  private static generateUniqueCpf(): string {
    return faker.number.int({ min: 10000000000, max: 99999999999 }).toString();
  }

  private static generateUniqueEmail(index?: number): string {
    const email = faker.internet.email();
    const [username, domain] = email.split('@');
    return `${username}${index ?? Date.now()}@${domain}`;
  }

  static async create(overrides?: Partial<User>, index?: number): Promise<User> {
    const password = 'ValidPassword123!';
    const hashedPassword = await bcryptjs.hash(password, 12);

    const user = await User.create({
      name: faker.person.fullName(),
      email: this.generateUniqueEmail(index),
      password: hashedPassword,
      cpf: this.generateUniqueCpf(),
      friendCode: this.generateFriendCode(),
      resetPasswordTokenHash: null,
      resetPasswordExpiresAt: null,
      ...overrides,
    });

    return user;
  }

  static async createMany(count: number, overrides?: Partial<User>): Promise<User[]> {
    const users: User[] = [];
    for (let i = 0; i < count; i++) {
      users.push(await this.create(overrides, i));
    }
    return users;
  }

  static async createWithPassword(password: string, overrides?: Partial<User>): Promise<User> {
    const hashedPassword = await bcryptjs.hash(password, 12);
    return this.create({
      password: hashedPassword,
      ...overrides,
    });
  }
}

export class TaskFactory {
  static async create(userId: number, overrides?: Partial<Task>): Promise<Task> {
    return Task.create({
      userId,
      activity: faker.lorem.sentence(),
      points: faker.number.int({ min: 5, max: 50 }),
      completed: false,
      analysis: null,
      scheduledFor: null,
      ...overrides,
    });
  }

  static async createMany(userId: number, count: number, overrides?: Partial<Task>): Promise<Task[]> {
    const tasks: Task[] = [];
    for (let i = 0; i < count; i++) {
      tasks.push(await this.create(userId, overrides));
    }
    return tasks;
  }

  static async createCompleted(userId: number, overrides?: Partial<Task>): Promise<Task> {
    return this.create(userId, {
      completed: true,
      analysis: faker.lorem.paragraph(),
      ...overrides,
    });
  }
}

export class UserFriendFactory {
  static async create(userId: number, friendId: number, overrides?: Partial<UserFriend>): Promise<UserFriend> {
    return UserFriend.create({
      userId,
      friendId,
      ...overrides,
    });
  }

  static async createMany(
    userId: number,
    friendIds: number[],
    overrides?: Partial<UserFriend>
  ): Promise<UserFriend[]> {
    const friendships: UserFriend[] = [];
    for (const friendId of friendIds) {
      friendships.push(await this.create(userId, friendId, overrides));
    }
    return friendships;
  }
}

export class AdminFactory {
  static async create(overrides?: Partial<Adm>): Promise<Adm> {
    const password = 'AdminPassword123!';
    const hashedPassword = await bcryptjs.hash(password, 12);

    return Adm.create({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: hashedPassword,
      ...overrides,
    });
  }

  static async createMany(count: number, overrides?: Partial<Adm>): Promise<Adm[]> {
    const admins: Adm[] = [];
    for (let i = 0; i < count; i++) {
      admins.push(await this.create(overrides));
    }
    return admins;
  }
}

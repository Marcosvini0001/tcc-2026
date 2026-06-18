import request from 'supertest';
import jwt from 'jsonwebtoken';
import User from '../models/userModels';

export interface AuthToken {
  token: string;
  userId: number;
}

export interface ApiResponse<T = any> {
  status: number;
  body: T;
}

export class ApiTestHelper {
  
  static generateToken(userId: number, role: string = 'user'): string {
    return jwt.sign(
      { id: userId, role },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '12h' }
    );
  }

  
  static async login(app: any, email: string, password: string): Promise<AuthToken> {
    const response = await request(app)
      .post('/auth/login')
      .send({ email, password });

    if (response.status !== 200) {
      throw new Error(`Login failed with status ${response.status}: ${JSON.stringify(response.body)}`);
    }

    return {
      token: response.body.token,
      userId: response.body.user.id,
    };
  }

  
  static async register(
    app: any,
    data: {
      name: string;
      email: string;
      password: string;
      cpf: string;
    }
  ): Promise<AuthToken> {
    const response = await request(app)
      .post('/auth/register')
      .send(data);

    if (response.status !== 201) {
      throw new Error(`Register failed with status ${response.status}: ${JSON.stringify(response.body)}`);
    }

    return {
      token: response.body.token,
      userId: response.body.user.id,
    };
  }
}

export class RequestBuilder {
  private app: any;
  private token?: string;
  private method: 'get' | 'post' | 'put' | 'delete' | 'patch' = 'get';
  private path: string = '';
  private body: any = null;

  constructor(app: any) {
    this.app = app;
  }

  
  withMethod(method: 'get' | 'post' | 'put' | 'delete' | 'patch'): this {
    this.method = method;
    return this;
  }

  
  withPath(path: string): this {
    this.path = path;
    return this;
  }

  
  withBody(body: any): this {
    this.body = body;
    return this;
  }

  
  withAuth(token: string): this {
    this.token = token;
    return this;
  }

  
  async execute(): Promise<any> {
    let req = request(this.app)[this.method](this.path);

    if (this.token) {
      req = req.set('Authorization', `Bearer ${this.token}`);
    }

    if (this.body) {
      req = req.send(this.body);
    }

    return req;
  }
}

export class AssertionHelper {
  
  static assertSuccess(response: any, expectedStatus: number = 200): void {
    if (response.status !== expectedStatus) {
      throw new Error(
        `Expected status ${expectedStatus}, got ${response.status}. Body: ${JSON.stringify(response.body)}`
      );
    }
  }

  
  static assertError(response: any, expectedStatus: number, expectedMessage?: string): void {
    if (response.status !== expectedStatus) {
      throw new Error(`Expected status ${expectedStatus}, got ${response.status}`);
    }

    if (expectedMessage && response.body.message !== expectedMessage) {
      throw new Error(
        `Expected message "${expectedMessage}", got "${response.body.message}"`
      );
    }
  }

  
  static assertHasFields(obj: any, fields: string[]): void {
    const missing = fields.filter(field => !(field in obj));
    if (missing.length > 0) {
      throw new Error(`Missing fields: ${missing.join(', ')}`);
    }
  }

  
  static assertEqual(actual: any, expected: any, fieldName: string = ''): void {
    if (actual !== expected) {
      throw new Error(
        `Expected ${fieldName} to be ${expected}, but got ${actual}`
      );
    }
  }

  
  static assertNotNull(value: any, fieldName: string): void {
    if (value === null || value === undefined) {
      throw new Error(`Expected ${fieldName} to not be null`);
    }
  }

  
  static assertArrayNotEmpty(arr: any[], fieldName: string = 'array'): void {
    if (!Array.isArray(arr) || arr.length === 0) {
      throw new Error(`Expected ${fieldName} to have items`);
    }
  }

  
  static assertArrayLength(arr: any[], expectedLength: number, fieldName: string = 'array'): void {
    if (!Array.isArray(arr) || arr.length !== expectedLength) {
      throw new Error(
        `Expected ${fieldName} to have ${expectedLength} items, got ${arr?.length || 0}`
      );
    }
  }
}

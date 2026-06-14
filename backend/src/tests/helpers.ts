import request from 'supertest';
import jwt from 'jsonwebtoken';
import User from '../models/userModels';

/**
 * Helpers reutilizáveis para testes de API
 * Reduz duplicação e centraliza lógica de teste
 */

export interface AuthToken {
  token: string;
  userId: number;
}

export interface ApiResponse<T = any> {
  status: number;
  body: T;
}

export class ApiTestHelper {
  /**
   * Gera um token JWT para teste
   */
  static generateToken(userId: number, role: string = 'user'): string {
    return jwt.sign(
      { id: userId, role },
      process.env.JWT_SECRET || 'your_secret_key',
      { expiresIn: '12h' }
    );
  }

  /**
   * Realiza login e retorna token e userId
   */
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

  /**
   * Realiza registro e retorna token
   */
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

  /**
   * Define o método HTTP
   */
  withMethod(method: 'get' | 'post' | 'put' | 'delete' | 'patch'): this {
    this.method = method;
    return this;
  }

  /**
   * Define o caminho da requisição
   */
  withPath(path: string): this {
    this.path = path;
    return this;
  }

  /**
   * Define o corpo da requisição
   */
  withBody(body: any): this {
    this.body = body;
    return this;
  }

  /**
   * Adiciona token de autenticação
   */
  withAuth(token: string): this {
    this.token = token;
    return this;
  }

  /**
   * Executa a requisição
   */
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
  /**
   * Valida resposta de sucesso
   */
  static assertSuccess(response: any, expectedStatus: number = 200): void {
    if (response.status !== expectedStatus) {
      throw new Error(
        `Expected status ${expectedStatus}, got ${response.status}. Body: ${JSON.stringify(response.body)}`
      );
    }
  }

  /**
   * Valida resposta de erro
   */
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

  /**
   * Valida estrutura da resposta
   */
  static assertHasFields(obj: any, fields: string[]): void {
    const missing = fields.filter(field => !(field in obj));
    if (missing.length > 0) {
      throw new Error(`Missing fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Valida valor de campo
   */
  static assertEqual(actual: any, expected: any, fieldName: string = ''): void {
    if (actual !== expected) {
      throw new Error(
        `Expected ${fieldName} to be ${expected}, but got ${actual}`
      );
    }
  }

  /**
   * Valida que campo não é nulo
   */
  static assertNotNull(value: any, fieldName: string): void {
    if (value === null || value === undefined) {
      throw new Error(`Expected ${fieldName} to not be null`);
    }
  }

  /**
   * Valida que array tem itens
   */
  static assertArrayNotEmpty(arr: any[], fieldName: string = 'array'): void {
    if (!Array.isArray(arr) || arr.length === 0) {
      throw new Error(`Expected ${fieldName} to have items`);
    }
  }

  /**
   * Valida tamanho do array
   */
  static assertArrayLength(arr: any[], expectedLength: number, fieldName: string = 'array'): void {
    if (!Array.isArray(arr) || arr.length !== expectedLength) {
      throw new Error(
        `Expected ${fieldName} to have ${expectedLength} items, got ${arr?.length || 0}`
      );
    }
  }
}

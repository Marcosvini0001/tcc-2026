import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Rate limiter simples em memória
 * Ideal para desenvolvimento. Para produção, use Redis
 */
export interface RateLimitConfig {
  windowMs: number; // Janela de tempo em ms
  maxRequests: number; // Máximo de requisições por janela
  skipSuccessfulRequests?: boolean; // Não contar requisições bem-sucedidas
  skipFailedRequests?: boolean; // Não contar requisições com erro
  message?: string; // Mensagem de erro customizada
}

interface ClientRequest {
  count: number;
  resetTime: number;
}

/**
 * Middleware de Rate Limiting
 */
class RateLimiter {
  private clients: Map<string, ClientRequest> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: 'Muitas requisições. Por favor, tente novamente mais tarde.',
      ...config,
    };

    // Limpar registros expirados periodicamente
    this.cleanupInterval();
  }

  /**
   * Obtém o identificador do cliente (IP ou user ID)
   */
  private getClientId(req: Request): string {
    // Tentar usar user ID se autenticado, senão usar IP
    const user = (req as any).user;
    if (user?.id) {
      return `user-${user.id}`;
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  /**
   * Verifica se cliente excedeu o limite
   */
  isLimited(clientId: string): boolean {
    const now = Date.now();
    const clientData = this.clients.get(clientId);

    // Cliente novo ou limite resetado
    if (!clientData || clientData.resetTime < now) {
      this.clients.set(clientId, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return false;
    }

    // Incrementar contador
    clientData.count++;

    // Verificar se excedeu limite
    return clientData.count > this.config.maxRequests;
  }

  /**
   * Obter informações sobre cliente
   */
  getClientInfo(clientId: string) {
    const clientData = this.clients.get(clientId);
    if (!clientData) {
      return {
        requests: 0,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowMs,
      };
    }

    return {
      requests: clientData.count,
      remaining: Math.max(0, this.config.maxRequests - clientData.count),
      resetTime: clientData.resetTime,
      resetIn: Math.ceil((clientData.resetTime - Date.now()) / 1000),
    };
  }

  /**
   * Limpar registros expirados
   */
  private cleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.clients.entries()) {
        if (value.resetTime < now) {
          this.clients.delete(key);
        }
      }
    }, this.config.windowMs);
  }

  /**
   * Middleware a ser usado com Express
   */
  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const clientId = this.getClientId(req);
      const isLimited = this.isLimited(clientId);
      const clientInfo = this.getClientInfo(clientId);

      // Adicionar headers de rate limit
      res.set('X-RateLimit-Limit', this.config.maxRequests.toString());
      res.set('X-RateLimit-Remaining', clientInfo.remaining.toString());
      res.set('X-RateLimit-Reset', new Date(clientInfo.resetTime).toISOString());

      if (isLimited) {
        logger.warn('Rate limit exceeded', {
          clientId,
          requestsIn15Min: clientInfo.requests,
          limit: this.config.maxRequests,
          resetIn: clientInfo.resetIn,
        });

        res.status(429).json({
          error: 'Too Many Requests',
          message: this.config.message,
          retryAfter: clientInfo.resetIn,
        });
        return;
      }

      // Adicionar informações ao request para uso posterior
      (req as any).rateLimit = clientInfo;

      next();
    };
  }

  /**
   * Reset de todas as limitações (útil para testes)
   */
  reset(): void {
    this.clients.clear();
  }
}

/**
 * Factory de rate limiters pré-configurados
 */
export class RateLimiters {
  /**
   * Rate limiter geral da API (100 req/min por IP)
   */
  static general(): RateLimiter {
    return new RateLimiter({
      windowMs: 60 * 1000, // 1 minuto
      maxRequests: 100,
      message: 'Você atingiu o limite de 100 requisições por minuto. Tente novamente em um momento.',
    });
  }

  /**
   * Rate limiter para autenticação (5 tentativas/5min)
   */
  static auth(): RateLimiter {
    return new RateLimiter({
      windowMs: 5 * 60 * 1000, // 5 minutos
      maxRequests: 5,
      message: 'Muitas tentativas de login. Tente novamente em 5 minutos.',
    });
  }

  /**
   * Rate limiter para criar recursos (20 por hora)
   */
  static create(): RateLimiter {
    return new RateLimiter({
      windowMs: 60 * 60 * 1000, // 1 hora
      maxRequests: 20,
      message: 'Limite de criação de recursos atingido. Tente novamente em 1 hora.',
    });
  }

  /**
   * Rate limiter customizado
   */
  static custom(config: RateLimitConfig): RateLimiter {
    return new RateLimiter(config);
  }
}

export default RateLimiter;

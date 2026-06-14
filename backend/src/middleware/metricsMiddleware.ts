import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Métricas de performance da aplicação
 */
export interface PerformanceMetrics {
  totalRequests: number;
  totalErrors: number;
  averageResponseTime: number;
  endpoints: Map<string, EndpointMetrics>;
  startTime: Date;
}

export interface EndpointMetrics {
  method: string;
  path: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  responseTimes: number[];
}

/**
 * Singleton para gerenciar métricas da aplicação
 */
class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: PerformanceMetrics;

  private constructor() {
    this.metrics = {
      totalRequests: 0,
      totalErrors: 0,
      averageResponseTime: 0,
      endpoints: new Map(),
      startTime: new Date(),
    };
  }

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  /**
   * Registra uma requisição
   */
  recordRequest(
    method: string,
    path: string,
    responseTime: number,
    statusCode: number,
    requestId: string
  ): void {
    const key = `${method} ${path}`;
    this.metrics.totalRequests++;

    // Atualizar ou criar métrica de endpoint
    if (!this.metrics.endpoints.has(key)) {
      this.metrics.endpoints.set(key, {
        method,
        path,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        responseTimes: [],
      });
    }

    const endpointMetric = this.metrics.endpoints.get(key)!;
    endpointMetric.totalRequests++;
    endpointMetric.responseTimes.push(responseTime);

    // Atualizar tempo médio
    const totalTime = endpointMetric.responseTimes.reduce((a, b) => a + b, 0);
    endpointMetric.averageResponseTime = totalTime / endpointMetric.responseTimes.length;

    // Calcular percentis
    const sorted = [...endpointMetric.responseTimes].sort((a, b) => a - b);
    endpointMetric.p95ResponseTime = sorted[Math.ceil(sorted.length * 0.95) - 1] || 0;
    endpointMetric.p99ResponseTime = sorted[Math.ceil(sorted.length * 0.99) - 1] || 0;

    // Contar sucesso/erro
    if (statusCode >= 400) {
      endpointMetric.failedRequests++;
      this.metrics.totalErrors++;
    } else {
      endpointMetric.successfulRequests++;
    }

    // Calcular média geral
    const allTimes = Array.from(this.metrics.endpoints.values())
      .flatMap(e => e.responseTimes);
    this.metrics.averageResponseTime = allTimes.length > 0
      ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length
      : 0;

    // Log com detalhes
    logger.info('Request metrics recorded', {
      requestId,
      method,
      path,
      statusCode,
      responseTime: `${responseTime}ms`,
      endpoint: {
        totalRequests: endpointMetric.totalRequests,
        averageResponseTime: `${endpointMetric.averageResponseTime.toFixed(2)}ms`,
        p95ResponseTime: `${endpointMetric.p95ResponseTime.toFixed(2)}ms`,
      },
    });
  }

  /**
   * Retorna métricas atualizadas
   */
  getMetrics(): PerformanceMetrics {
    return {
      ...this.metrics,
      endpoints: new Map(this.metrics.endpoints),
    };
  }

  /**
   * Retorna métricas de um endpoint específico
   */
  getEndpointMetrics(method: string, path: string): EndpointMetrics | undefined {
    const key = `${method} ${path}`;
    return this.metrics.endpoints.get(key);
  }

  /**
   * Reseta as métricas
   */
  reset(): void {
    this.metrics = {
      totalRequests: 0,
      totalErrors: 0,
      averageResponseTime: 0,
      endpoints: new Map(),
      startTime: new Date(),
    };
  }
}

/**
 * Middleware para coleta de métricas de performance
 * Mede tempo de resposta de cada requisição
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string || 'unknown';

  // Interceptar o envio da resposta
  const originalSend = res.send;
  res.send = function (data: any): any {
    const responseTime = Date.now() - startTime;
    const metricsCollector = MetricsCollector.getInstance();

    metricsCollector.recordRequest(
      req.method,
      req.route?.path || req.path,
      responseTime,
      res.statusCode,
      requestId
    );

    // Chamar o método original
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware para retornar métricas
 */
export const metricsEndpoint = (req: Request, res: Response): void => {
  const metricsCollector = MetricsCollector.getInstance();
  const metrics = metricsCollector.getMetrics();

  const endpointMetricsArray = Array.from(metrics.endpoints.values()).map(m => ({
    ...m,
    responseTimes: undefined, // Não incluir array de tempos na resposta
    averageResponseTime: parseFloat(m.averageResponseTime.toFixed(2)),
    p95ResponseTime: parseFloat(m.p95ResponseTime.toFixed(2)),
    p99ResponseTime: parseFloat(m.p99ResponseTime.toFixed(2)),
  }));

  res.json({
    uptime: new Date().getTime() - metrics.startTime.getTime(),
    totalRequests: metrics.totalRequests,
    totalErrors: metrics.totalErrors,
    errorRate: metrics.totalRequests > 0 
      ? parseFloat((metrics.totalErrors / metrics.totalRequests * 100).toFixed(2))
      : 0,
    averageResponseTime: parseFloat(metrics.averageResponseTime.toFixed(2)),
    endpoints: endpointMetricsArray,
  });
};

export default MetricsCollector;

# PERFORMANCE E ESCALABILIDADE - TCC 2026

## 1. ESTRATÉGIAS DE CACHE

### Cache em Memória (Redis - Recomendado para Produção)
```typescript
// Exemplo de implementação com Redis
import redis from 'redis';

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

// Cache de dados de usuário
async function getUserWithCache(userId: number) {
  const cacheKey = `user:${userId}`;
  const cached = await client.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const user = await User.findByPk(userId);
  if (user) {
    await client.setex(cacheKey, 3600, JSON.stringify(user)); // 1 hora
  }
  
  return user;
}
```

### Cache de Resultados de Consultas Frequentes
- **Ranking de usuários**: Cache por 5 minutos
- **Dados de progresso**: Cache por 10 minutos
- **Métricas agregadas**: Cache por 1 hora

## 2. OTIMIZAÇÕES DE BANCO DE DADOS

### Índices Implementados
```sql
-- Índices existentes
INDEX idx_users_email ON users(email);
INDEX idx_users_cpf ON users(cpf);
INDEX idx_tasks_user_id ON tasks(user_id);
INDEX idx_tasks_user_id_completed ON tasks(user_id, completed);
INDEX idx_user_friends_unique ON user_friends(user_id, friend_id);
```

### Lazy Loading vs Eager Loading
```typescript
// Lazy loading - mais eficiente para dados opcionais
const user = await User.findByPk(userId);

// Eager loading - usar quando necessário
const userWithTasks = await User.findByPk(userId, {
  include: ['tasks']
});
```

### Pagination para Grandes Datasets
```typescript
async function getTasksPage(userId: number, page: number = 1, limit: number = 20) {
  const offset = (page - 1) * limit;
  return Task.findAll({
    where: { userId },
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });
}
```

## 3. MONITORAMENTO DE PERFORMANCE

### Métricas Coletadas (Middleware)
- **Response Time**: Tempo total de resposta por endpoint
- **Throughput**: Requisições por segundo
- **Error Rate**: Percentual de erros (5xx)
- **Percentis**: P95, P99 de tempo de resposta

### Endpoint de Métricas
```
GET /metrics
```

Retorna:
```json
{
  "uptime": 3600000,
  "totalRequests": 1250,
  "totalErrors": 12,
  "errorRate": 0.96,
  "averageResponseTime": 45.23,
  "endpoints": [
    {
      "method": "GET",
      "path": "/users/:id",
      "totalRequests": 450,
      "successfulRequests": 448,
      "failedRequests": 2,
      "averageResponseTime": 25.10,
      "p95ResponseTime": 85.50,
      "p99ResponseTime": 120.30
    }
  ]
}
```

## 4. RATE LIMITING

### Limites Configurados
- **Geral**: 100 requisições/minuto por IP
- **Autenticação**: 5 tentativas/5 minutos
- **Criação de recursos**: 20/hora

### Headers de Rate Limit
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 2026-06-14T12:35:00Z
```

## 5. LOGGING E OBSERVABILIDADE

### Elasticsearch + Kibana
- **Logs centralizados** para análise
- **Dashboard** para visualizar erros e performance
- **Alertas** para anomalias

### Variáveis de Ambiente
```
ELASTICSEARCH_ENABLED=true
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200
LOG_LEVEL=info
```

### Iniciar Stack ELK
```bash
docker-compose up -d
# Kibana disponível em: http://localhost:5601
```

## 6. RECOMENDAÇÕES PARA ESCALABILIDADE

### Curto Prazo (MVP)
1. ✅ Implementar rate limiting
2. ✅ Adicionar cache em memória
3. ✅ Monitorar com métricas locais
4. ✅ Otimizar índices de BD

### Médio Prazo
1. Migrar para Redis para cache distribuído
2. Implementar Connection Pooling no DB
3. Usar CDN para assets estáticos
4. Setup de Elasticsearch centralizado

### Longo Prazo (Microserviços)
1. Separar domínios em serviços
2. Message Queue (RabbitMQ/Kafka)
3. API Gateway com load balancing
4. Replicação de BD (sharding)

## 7. BENCHMARKS E SLAS

### SLA Targets
| Métrica | Target | P95 | P99 |
|---------|--------|-----|-----|
| API Response | <100ms | <200ms | <500ms |
| Database Query | <50ms | <100ms | <300ms |
| Error Rate | <0.5% | - | - |
| Uptime | 99.9% | - | - |

### Load Testing
```bash
# Usar Apache JMeter ou Artillery
artillery quick --count 100 --num 1000 http://localhost:3000/health
```

## 8. TROUBLESHOOTING

### Alto Tempo de Resposta
1. Verificar métricas em `/metrics`
2. Analisar logs em Kibana
3. Verificar índices de BD: `EXPLAIN`
4. Implementar caching

### Alto Rate de Erros
1. Verificar logs de erro em Kibana
2. Revisar rate limiting
3. Verificar conectividade com BD
4. Analisar testes de integração

### Memória/CPU Alta
1. Analisar query performance
2. Ajustar pool de conexões
3. Implementar pagination
4. Escalar horizontalmente

---

**Documentação Atualizada**: 2026-06-14
**Versão**: 1.0

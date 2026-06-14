# TESTES E OBSERVABILIDADE - Guia de Implementação

## 📋 Resumo das Implementações

### ✅ Testes de Integração CRUD (Completo)
- **Factories** para dados de teste ([src/tests/factories.ts](src/tests/factories.ts))
- **Helpers** reutilizáveis de API ([src/tests/helpers.ts](src/tests/helpers.ts))
- **Testes de Integração** CRUD completo ([src/tests/integration.test.ts](src/tests/integration.test.ts))

**Coverage:**
- ✅ User CRUD (Create, Read, Update, Delete)
- ✅ Task CRUD com cascata de deleção
- ✅ UserFriend (relacionamentos)
- ✅ Padrão AAA (Arrange, Act, Assert)

### ✅ Padrão AAA Refatorado
- ✅ [src/services/authService.test.ts](src/services/authService.test.ts) - Refatorado com AAA explícito
- ✅ [src/services/progressService.test.ts](src/services/progressService.test.ts) - Refatorado com AAA explícito

### ✅ Métricas de Performance
- ✅ Middleware de coleta de métricas ([src/middleware/metricsMiddleware.ts](src/middleware/metricsMiddleware.ts))
- ✅ Endpoint `/metrics` com estatísticas detalhadas
- ✅ P95, P99, average response time por endpoint

### ✅ Rate Limiting
- ✅ Rate Limiter geral (100 req/min)
- ✅ Rate Limiter de autenticação (5 tentativas/5 min)
- ✅ Rate Limiter de criação (20/hora)
- ✅ Headers X-RateLimit com informações

### ✅ Kibana/ELK Integration
- ✅ Docker Compose para Elasticsearch, Kibana, Logstash
- ✅ Transport customizado para Elasticsearch
- ✅ Logs centralizados e estruturados

### ✅ Documentação de Performance
- ✅ [docs/PERFORMANCE_ESCALABILIDADE.md](../docs/PERFORMANCE_ESCALABILIDADE.md)

---

## 🚀 Como Executar

### 1. Instalar Dependências

```bash
cd backend
npm install
```

As dependências já foram adicionadas:
- `@faker-js/faker` - Geração de dados de teste
- `supertest` - Testes de API HTTP
- `@types/supertest` - Type definitions

### 2. Executar Testes de Integração

```bash
# Executar testes uma vez
npm run test

# Executar com watch mode
npm run test:watch

# Executar apenas testes de integração
npm test -- integration.test.ts
```

**Testes Implementados:**
- ✅ 15+ testes de User CRUD
- ✅ 10+ testes de Task CRUD
- ✅ 5+ testes de UserFriend
- ✅ Testes de padrão AAA em services

### 3. Iniciar Elasticsearch + Kibana

```bash
# Na raiz do projeto
docker-compose up -d

# Verificar status
docker ps | grep tcc-

# Acessar Kibana
# http://localhost:5601

# Acessar Elasticsearch
# http://localhost:9200
```

### 4. Habilitar Logging no Elasticsearch

Editar `.env`:

```env
ELASTICSEARCH_ENABLED=true
ELASTICSEARCH_HOST=localhost
ELASTICSEARCH_PORT=9200
NODE_ENV=production
```

### 5. Visualizar Métricas

```bash
# Iniciar o servidor
npm run dev

# Em outro terminal
curl http://localhost:3000/metrics | jq

# Resultado:
{
  "uptime": 12345,
  "totalRequests": 50,
  "totalErrors": 2,
  "errorRate": 4.0,
  "averageResponseTime": 45.23,
  "endpoints": [
    {
      "method": "GET",
      "path": "/users/:id",
      "totalRequests": 25,
      "averageResponseTime": 35.10,
      "p95ResponseTime": 85.50,
      "p99ResponseTime": 120.30
    }
  ]
}
```

### 6. Testar Rate Limiting

```bash
# Fazer 101 requisições (limite é 100/min)
for i in {1..105}; do curl -i http://localhost:3000/health | head -1; done

# Na 101ª requisição:
# HTTP/1.1 429 Too Many Requests
# {
#   "error": "Too Many Requests",
#   "message": "Você atingiu o limite de 100 requisições por minuto",
#   "retryAfter": 45
# }
```

---

## 📊 Kibana - Visualizar Logs

Após iniciar os containers:

1. Abrir http://localhost:5601
2. Criar data source: `tcc-logs-*`
3. Visualizar logs em Discover
4. Criar dashboards personalizados

### Exemplo de Query
```json
{
  "query": {
    "match": {
      "level": "error"
    }
  }
}
```

---

## 🏗️ Arquitetura de Testes

### Factory Pattern
```typescript
// Criar usuário com dados random
const user = await UserFactory.create();

// Criar com customização
const user = await UserFactory.create({ email: 'custom@example.com' });

// Criar múltiplos
const users = await UserFactory.createMany(5);
```

### Helper Pattern
```typescript
// Login e obter token
const auth = await ApiTestHelper.login(app, email, password);

// Builder para requisições
const response = await new RequestBuilder(app)
  .withMethod('post')
  .withPath('/tasks')
  .withAuth(auth.token)
  .withBody({ activity: 'Test', points: 10 })
  .execute();

// Assertions centralizadas
AssertionHelper.assertSuccess(response, 201);
AssertionHelper.assertHasFields(response.body, ['id', 'activity']);
```

### Padrão AAA
```typescript
describe('Feature', () => {
  it('deve fazer algo quando condição', () => {
    // Arrange - preparar dados
    const data = { name: 'Test' };

    // Act - executar ação
    const result = await service.create(data);

    // Assert - verificar resultado
    expect(result.id).toBeDefined();
  });
});
```

---

## 📈 Métricas Disponíveis

Endpoint: `GET /metrics`

```typescript
interface PerformanceMetrics {
  uptime: number;                    // ms desde início
  totalRequests: number;             // Total de requisições
  totalErrors: number;               // Total de erros 5xx
  errorRate: number;                 // Percentual de erros
  averageResponseTime: number;       // Tempo médio (ms)
  endpoints: EndpointMetrics[];      // Por endpoint
}

interface EndpointMetrics {
  method: string;
  path: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;           // 95º percentil
  p99ResponseTime: number;           // 99º percentil
}
```

---

## ⚙️ Troubleshooting

### Testes falhando com erro de conexão DB
```bash
# Garantir que BD está rodando
mysql -h localhost -u root -p tcc_db

# Se não existir, criar:
mysql -u root -e "CREATE DATABASE tcc_db;"
```

### Elasticsearch não conecta
```bash
# Verificar se container está rodando
docker logs tcc-elasticsearch

# Reiniciar
docker-compose down
docker-compose up -d
```

### Rate limiter muito restritivo
Editar `src/middleware/rateLimitMiddleware.ts` e ajustar:
```typescript
static general(): RateLimiter {
  return new RateLimiter({
    windowMs: 60 * 1000,      // Aumentar janela
    maxRequests: 100,          // Aumentar limite
  });
}
```

---

## 📚 Referências

- [Winston Logger](https://github.com/winstonjs/winston)
- [Elastic Stack](https://www.elastic.co/pt/what-is/elk-stack)
- [Vitest](https://vitest.dev/)
- [Supertest](https://github.com/visionmedia/supertest)
- [Faker.js](https://fakerjs.dev/)

---

**Documentação atualizada:** 2026-06-14
**Versão:** 1.0

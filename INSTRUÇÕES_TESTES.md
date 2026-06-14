# Testes e Observabilidade - Instruções de Execução

## 🧪 Testes Unitários (Sem Dependência de BD)

Os testes de services já existentes funcionam sem BD externo:

```bash
cd backend

# Executar apenas testes de services (authService, progressService)
npm test -- services/

# Resultado esperado: ~20 testes passando
```

## 🔄 Testes de Integração CRUD (Com BD)

Os testes de integração CRUD estão implementados mas requerem banco de dados.

### Opção 1: Usar SQLite em Memória (Recomendado para Desenvolvimento)

Os testes estão configurados para usar SQLite. Basta instalar:

```bash
npm install --save-dev sqlite3
```

### Opção 2: Usar MySQL (Recomendado para Produção)

```bash
# Garantir que MySQL está rodando
# Windows: usar MySQL Community Server ou Docker

# Criar banco de testes
mysql -u root -e "CREATE DATABASE tcc_db_test;"

# Executar testes
npm test -- integration.test.ts
```

### Opção 3: Usar Docker (Mais Fácil)

```bash
# Na raiz do projeto, criar docker-compose-test.yml
# ou usar o existente e criar um banco de testes

docker-compose up -d
mysql -h localhost -u root -e "CREATE DATABASE tcc_db_test;"

npm test -- integration.test.ts
```

## 📊 Estrutura de Testes Implementada

### 1. Factories (Geração de Dados)
```
src/tests/factories.ts
  ├─ UserFactory
  ├─ TaskFactory
  ├─ UserFriendFactory
  └─ AdminFactory
```

### 2. Helpers (Reutilizáveis)
```
src/tests/helpers.ts
  ├─ ApiTestHelper (login, register)
  ├─ RequestBuilder (builder pattern)
  └─ AssertionHelper (assertions centralizadas)
```

### 3. Testes CRUD
```
src/tests/integration.test.ts
  ├─ User CRUD (13 testes)
  ├─ Task CRUD (11 testes)
  └─ UserFriend CRUD (5 testes)
  Total: 29 testes com padrão AAA
```

### 4. Testes Refatorados (AAA)
```
src/services/authService.test.ts       (10 testes)
src/services/progressService.test.ts   (10 testes)
```

## 🚀 Executar Todos os Testes

```bash
# Uma única vez
npm run test

# Com watch (reexecuta ao salvar)
npm run test:watch

# Com coverage
npm run test -- --coverage

# Apenas um arquivo
npm test -- authService.test.ts

# Apenas um describe
npm test -- --grep "Password Validation"
```

## 📈 Métricas e Performance

### Endpoint de Métricas
```bash
npm run dev

# Em outro terminal
curl http://localhost:3000/metrics | jq
```

Retorna:
```json
{
  "uptime": 12000,
  "totalRequests": 50,
  "totalErrors": 1,
  "errorRate": 2.0,
  "averageResponseTime": 42.5,
  "endpoints": [
    {
      "method": "GET",
      "path": "/health",
      "totalRequests": 25,
      "successfulRequests": 25,
      "failedRequests": 0,
      "averageResponseTime": 2.3,
      "p95ResponseTime": 5.1,
      "p99ResponseTime": 8.3
    }
  ]
}
```

## 🔐 Rate Limiting

### Testar Rate Limiting
```bash
npm run dev

# Em outro terminal, fazer múltiplas requisições
for i in {1..105}; do
  curl -i http://localhost:3000/health
done

# A 101ª requisição retornará 429 Too Many Requests
```

### Headers de Rate Limit
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 2026-06-14T12:35:00Z
```

## 📊 Kibana e Elasticsearch

### Iniciar Stack ELK
```bash
# Na raiz do projeto
docker-compose up -d

# Verificar containers
docker ps | grep tcc-

# Kibana: http://localhost:5601
# Elasticsearch: http://localhost:9200
```

### Habilitar Elasticsearch
```bash
# .env
ELASTICSEARCH_ENABLED=true
NODE_ENV=production
```

### Criar Dashboard no Kibana
1. Abrir http://localhost:5601
2. Ir para "Discover"
3. Criar index pattern: `tcc-logs-*`
4. Visualizar logs

## 📝 Exemplos de Testes

### Teste com Factory
```typescript
it('deve criar usuário com dados válidos', async () => {
  // Arrange
  const user = await UserFactory.create({ email: 'test@example.com' });

  // Act
  const found = await User.findByPk(user.id);

  // Assert
  expect(found?.email).toBe('test@example.com');
});
```

### Teste com Helper
```typescript
it('deve criar tarefa com autenticação', async () => {
  // Arrange
  const user = await UserFactory.create();
  const auth = await ApiTestHelper.login(app, user.email, 'password');

  // Act
  const response = await new RequestBuilder(app)
    .withMethod('post')
    .withPath('/tasks')
    .withAuth(auth.token)
    .withBody({ activity: 'Test', points: 10 })
    .execute();

  // Assert
  AssertionHelper.assertSuccess(response, 201);
  expect(response.body.activity).toBe('Test');
});
```

### Teste com AssertionHelper
```typescript
it('deve validar resposta', async () => {
  // Arrange & Act
  const response = await request(app).get('/users');

  // Assert
  AssertionHelper.assertSuccess(response, 200);
  AssertionHelper.assertArrayNotEmpty(response.body, 'users');
  AssertionHelper.assertHasFields(response.body[0], ['id', 'email']);
});
```

## 🐛 Troubleshooting

### Erro: ECONNREFUSED (MySQL não conecta)
```bash
# Verificar se MySQL está rodando
mysql -u root -p

# Se estiver usando Docker
docker-compose up -d
```

### Erro: Cannot find module '@faker-js/faker'
```bash
npm install --save-dev @faker-js/faker
```

### Erro: SQLite3 não encontrado
```bash
npm install --save-dev sqlite3
```

### Testes muito lentos
- Usar SQLite em memória em vez de MySQL
- Criar índices nas tabelas
- Usar batch inserts para múltiplos registros

## 📚 Arquivos Principais

| Arquivo | Descrição |
|---------|-----------|
| `src/tests/factories.ts` | Geração de dados de teste |
| `src/tests/helpers.ts` | Helpers reutilizáveis |
| `src/tests/integration.test.ts` | Testes CRUD (29 testes) |
| `src/tests/setup.ts` | Configuração de BD para testes |
| `src/middleware/metricsMiddleware.ts` | Coleta de métricas |
| `src/middleware/rateLimitMiddleware.ts` | Rate limiting |
| `src/middleware/elasticsearchTransport.ts` | Integração Elasticsearch |
| `docs/PERFORMANCE_ESCALABILIDADE.md` | Estratégias de performance |

## ✅ Checklist de Implementação

- ✅ Factories para dados de teste
- ✅ Helpers reutilizáveis de API
- ✅ 29 testes de integração CRUD
- ✅ Padrão AAA refatorado
- ✅ Middleware de métricas
- ✅ Rate limiting (3 níveis)
- ✅ Integração Elasticsearch/Kibana
- ✅ Documentação de performance

---

**Última atualização:** 2026-06-14
**Versão:** 1.0

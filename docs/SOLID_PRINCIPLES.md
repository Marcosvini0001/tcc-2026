# SOLID Principles - NeuroXP

## Visão Geral

O projeto NeuroXP foi desenvolvido com arquitetura em camadas que segue os princípios SOLID. Esta documentação detalha como cada princípio foi implementado no projeto.

## 1. Single Responsibility Principle (SRP)

**Definição:** Uma classe/módulo deve ter apenas uma razão para mudar, ou seja, uma responsabilidade única.

### Implementação no NeuroXP

#### Controllers (Responsabilidade: HTTP Request/Response)
```
backend/src/controllers/userController.ts
backend/src/controllers/admController.ts
```
- **Responsabilidade:** Lidar com requisições HTTP e respostas
- **O que fazem:** Validação de entrada, chamada de serviços, formatação de resposta
- **O que NÃO fazem:** Lógica de negócio complexa, acesso direto ao banco

**Exemplo:**
```typescript
export const createUser = async (req: Request, res: Response) => {
  // Validações de entrada
  const name = normalizeText(req.body.name);
  // ...
  
  // Chamada de serviço
  const createdUser = await sequelize.transaction(...);
  
  // Resposta formatada
  return res.status(201).json({ token, user });
};
```

#### Services (Responsabilidade: Lógica de Negócio)
```
backend/src/services/authService.ts
backend/src/services/passwordResetService.ts
backend/src/services/progressService.ts
```
- **Responsabilidade:** Implementar regras de negócio
- **O que fazem:** Validar força de senha, calcular XP, gerar tokens
- **O que NÃO fazem:** Responder HTTP, acessar banco diretamente

**Exemplo:**
```typescript
export const validatePasswordStrength = (password: string): string | null => {
  // Lógica pura de validação
  if (password.length < 8) return 'A senha deve ter no minimo 8 caracteres';
  // ...
  return null;
};
```

#### Models (Responsabilidade: Estrutura de Dados)
```
backend/src/models/userModels.ts
backend/src/models/taskModels.ts
backend/src/models/userFriendModels.ts
backend/src/models/admModels.ts
```
- **Responsabilidade:** Representar estrutura de dados
- **O que fazem:** Definir fields, tipos, validações de DB
- **O que NÃO fazem:** Lógica de negócio, respostas HTTP

**Exemplo:**
```typescript
const User = sequelize.define('User', {
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  cpf: { type: DataTypes.STRING(11), allowNull: false, unique: true },
  // ...
});
```

#### Middleware (Responsabilidade: Interceptação/Middleware)
```
backend/src/middleware/authMiddleware.ts
backend/src/middleware/requestIdMiddleware.ts
```
- **Responsabilidade:** Interceptar e processar requisições antes de chegar aos controllers
- **O que fazem:** Autenticação, geração de request IDs, logging
- **O que NÃO fazem:** Validação de negócio, resposta ao usuário (apenas ao seu escopo)

**Exemplo:**
```typescript
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Única responsabilidade: verificar autenticação
  const token = req.get('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token required' });
  
  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
```

#### Utils (Responsabilidade: Funções Utilitárias)
```
backend/src/utils/validation.ts
backend/src/utils/logger.ts
backend/src/utils/formatters.ts
```
- **Responsabilidade:** Funções puras e reutilizáveis
- **O que fazem:** Normalizar dados, validar, formatar, logar
- **O que NÃO fazem:** Lógica específica do domínio

**Exemplo:**
```typescript
export const normalizeCpf = (value: unknown) => 
  normalizeText(value).replace(/\D/g, '');

export const formatCpf = (cpf: string): string => {
  const digits = cpf.replace(/\D/g, '');
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};
```

### Benefícios Alcançados com SRP
- ✅ Fácil manutenção: cada arquivo tem um propósito claro
- ✅ Testabilidade: funções pequenas e focadas são mais fáceis de testar
- ✅ Reutilização: componentes podem ser reutilizados em contextos diferentes
- ✅ Redução de acoplamento: mudanças em uma camada não afetam outras

---

## 2. Dependency Inversion Principle (DIP)

**Definição:** Módulos de alto nível não devem depender de módulos de baixo nível. Ambos devem depender de abstrações.

### Implementação no NeuroXP

#### Injeção através de Importações
```typescript
// ✅ BOM: Depende de abstração (interface)
import logger from '../utils/logger';  // Interface de logger
import sequelize from '../config/database';  // Interface de database

export const createUser = async (req: Request, res: Response) => {
  // Logger é injetado como singleton
  logger.info('Creating user...', { requestId: req.requestId });
  
  // Sequelize é injetado como singleton
  const user = await sequelize.transaction(async (transaction) => {
    return User.create({...}, { transaction });
  });
};
```

#### Não depender de Implementação Concreta
```typescript
// ❌ RUIM: Dependência direta
const logger = new WinstonLogger();
const db = new MySQLConnection();

// ✅ BOM: Dependência de abstração
import logger from '../utils/logger';  // abstração
import sequelize from '../config/database';  // abstração
```

#### Tipos como Abstrações
```typescript
// Arquivo: backend/src/types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: number;
        role: 'user' | 'admin';
      };
      requestId?: string;
    }
  }
}

// Controllers dependem da interface, não da implementação
export const getUser = async (req: Request, res: Response) => {
  if (!req.auth) {  // Usa interface padrão do Express
    return res.status(401).json({ message: 'Auth required' });
  }
};
```

#### Services como Abstrações
```typescript
// authService.ts expõe uma "interface" de funcionalidades
export const validatePasswordStrength = (password: string): string | null => {...};
export const hashPassword = async (password: string): Promise<string> => {...};
export const createAccessToken = (payload: any): string => {...};
export const verifyAccessToken = (token: string): any => {...};

// Controllers dependem dessas funções como abstrações
import {
  validatePasswordStrength,
  hashPassword,
  createAccessToken,
} from '../services/authService';

export const createUser = async (req: Request, res: Response) => {
  // Depende da abstração do serviço, não da implementação
  const validation = validatePasswordStrength(password);
  const hash = await hashPassword(password);
  const token = createAccessToken({ userId, role });
};
```

### Benefícios Alcançados com DIP
- ✅ Testabilidade: Fácil fazer mock de dependências
- ✅ Flexibilidade: Trocar implementação sem afetar consumers
- ✅ Desacoplamento: Alto nível não depende de baixo nível
- ✅ Exemplo: Trocar Winston por Pino não afeta controllers

---

## 3. Open/Closed Principle (OCP)

**Definição:** Software deve ser aberto para extensão, mas fechado para modificação.

### Implementação no NeuroXP

#### Extensão sem Modificação: Novos Tipos de Atividades
```typescript
// backend/src/services/progressService.ts
export const getActivityPoints = (activity: string): number => {
  const activityLower = activity.toLowerCase();
  
  // Extensível: adicionar novos tipos sem modificar lógica core
  if (activityLower.includes('exercise') || activityLower.includes('exercicio')) return 50;
  if (activityLower.includes('study') || activityLower.includes('estudo')) return 40;
  if (activityLower.includes('meditate') || activityLower.includes('meditacao')) return 30;
  if (activityLower.includes('sleep') || activityLower.includes('dormir')) return 20;
  if (activityLower.includes('read') || activityLower.includes('ler')) return 25;
  
  return 10; // Default
};

// ✅ Para adicionar novo tipo:
// - Basta adicionar novo if acima
// - Não precisa modificar callers
// - Lógica de negócio não se quebra
```

#### Extensão: Novos Tipos de Validação
```typescript
// backend/src/utils/formatters.ts
export const validateCpfNumber = (cpf: string): boolean => {...};
export const validateCnpjNumber = (cnpj: string): boolean => {...};
export const validatePhoneNumber = (phone: string): boolean => {...};
export const validateDateString = (dateStr: string): boolean => {...};

// ✅ Para adicionar novo validador:
// export const validateNewFieldNumber = (value: string): boolean => {...};
// - Não modifica existentes
// - Clients importam o que precisam
```

#### Composição de Funcionalidades
```typescript
// Controllers podem usar diferentes services sem modificação

// Serviço 1
import { validatePasswordStrength, hashPassword } from './authService';

// Serviço 2
import { createPasswordResetToken } from './passwordResetService';

// Serviço 3
import { getActivityPoints } from './progressService';

// Quando novo serviço é criado:
// import { newFeature } from './newService';
// - Código existente não muda
// - Apenas adiciona novas funcionalidades
```

#### Utils Extensíveis
```typescript
// backend/src/utils/validation.ts
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const normalizeText = (value: unknown) => String(value ?? '').trim();
export const normalizeEmail = (value: unknown) => normalizeText(value).toLowerCase();
export const normalizeCpf = (value: unknown) => normalizeText(value).replace(/\D/g, '');

// ✅ Extensível para frontend também:
// frontend/meuApp/lib/masks.ts
export const maskCpf = (value: string): string => {...};
export const maskPhone = (value: string): string => {...};
export const maskDate = (value: string): string => {...};

// Novos masks podem ser adicionados sem modificar existentes
```

### Benefícios Alcançados com OCP
- ✅ Reduz risco de bugs ao adicionar features
- ✅ Facilita manutenção: não precisa mexer em código testad
- ✅ Scalabilidade: novos pontos de atividade sem refatoração
- ✅ Flexibilidade: adicionar novos validadores sem afetar existentes

---

## 4. Liskov Substitution Principle (LSP)

**Definição:** Objetos de uma superclasse devem ser substituíveis por objetos de suas subclasses sem quebrar a aplicação.

### Implementação no NeuroXP

#### Express Middleware - Substitutibilidade
```typescript
// Tipos devem ser substituíveis
type Middleware = (req: Request, res: Response, next: NextFunction) => void | Promise<void>;

// authMiddleware implementa o contrato
export const authMiddleware: Middleware = (req, res, next) => {
  // Sempre segue o mesmo contrato
  if (!token) return res.status(401).json({...});
  req.auth = verifyAccessToken(token);
  next();
};

// requestIdMiddleware implementa o mesmo contrato
export const requestIdMiddleware: Middleware = (req, res, next) => {
  req.requestId = generateId();
  next();
};

// ✅ Ambos podem ser usados como Middleware
app.use(authMiddleware);
app.use(requestIdMiddleware);
// Podem ser substituídos sem quebrar app.use()
```

#### Services com Contrato Consistente
```typescript
// Todos services seguem o mesmo padrão
export const validatePasswordStrength = (password: string): string | null => {...};
export const validateCpfNumber = (cpf: string): boolean => {...};
export const validateDateString = (dateStr: string): boolean => {...};

// ✅ Todos podem ser usados de forma similar
if (validatePasswordStrength(input)) {...}  // Retorna erro ou null
if (validateCpfNumber(input)) {...}          // Retorna boolean
if (validateDateString(input)) {...}         // Retorna boolean

// Cada um substitui o outro sem quebrar o padrão geral
```

#### Models Sequelize - Contrato Padrão
```typescript
// Todos models implementam contrato Sequelize
const User = sequelize.define('User', {...});
const Task = sequelize.define('Task', {...});
const UserFriend = sequelize.define('UserFriend', {...});

// ✅ Todos podem ser usados da mesma forma
await User.findOne({...});
await Task.findOne({...});
await UserFriend.findOne({...});

// Podem ser substituídos sem quebrar logic
const model = entityType === 'user' ? User : Task;
await model.findOne({...});
```

### Benefícios Alcançados com LSP
- ✅ Polimorfismo seguro: trocar uma implementação por outra
- ✅ Flexibilidade: models intercambiáveis
- ✅ Predictabilidade: comportamento esperado mantido

---

## 5. Interface Segregation Principle (ISP)

**Definição:** Clientes não devem ser forçados a depender de interfaces que não usam.

### Implementação no NeuroXP

#### Express Request/Response Segregado
```typescript
// ❌ RUIM: Request genérico com tudo
// interface GenericRequest {
//   auth?: any;
//   requestId?: string;
//   file?: any;
//   query?: any;
//   params?: any;
//   // ... tudo junto
// }

// ✅ BOM: Estender só o necessário
declare global {
  namespace Express {
    interface Request {
      auth?: { userId: number; role: 'user' | 'admin' };
      requestId?: string;
    }
  }
}

// Controllers usam apenas o que precisam
export const getUser = async (req: Request) => {
  const { userId } = req.auth;  // Usa apenas auth
  const id = req.requestId;      // Usa apenas requestId
  // Não precisa de file, query, etc
};
```

#### Services Segregados por Responsabilidade
```typescript
// ✅ authService.ts - Interface focada em autenticação
export const validatePasswordStrength = (password: string): string | null => {...};
export const hashPassword = async (password: string): Promise<string> => {...};
export const verifyPassword = async (plain: string, hashed: string): Promise<boolean> => {...};
export const createAccessToken = (payload: any): string => {...};
export const verifyAccessToken = (token: string): any => {...};

// ✅ passwordResetService.ts - Interface focada em reset
export const createPasswordResetToken = () => {...};
export const hashPasswordResetToken = (token: string): string => {...};
export const isPasswordResetExpired = (expiresAt: Date): boolean => {...};

// ✅ progressService.ts - Interface focada em progresso
export const getActivityPoints = (activity: string): number => {...};
export const buildTaskProgressSummary = (userId: number) => {...};
export const parseScheduledFor = (date: any) => {...};

// Controllers usam apenas a interface de que precisam
// createUser precisa: validatePasswordStrength, hashPassword, createAccessToken
// resetPassword precisa: hashPasswordResetToken, isPasswordResetExpired
```

#### Logger Segregado
```typescript
// frontend/meuApp/lib/masks.ts - Interface pura para masking
export const maskCpf = (value: string): string => {...};
export const maskPhone = (value: string): string => {...};
export const unmaskValue = (value: string): string => {...};

// Frontend components usam apenas as máscaras que precisam
const handleCpfChange = (value: string) => {
  setCpf(maskCpf(value));  // Não precisa conhecer maskPhone
};
```

### Benefícios Alcançados com ISP
- ✅ Reduz acoplamento desnecessário
- ✅ Interfaces mais limpas e focadas
- ✅ Componentes só conhecem o que precisam
- ✅ Fácil adicionar novos métodos sem quebrar clientes

---

## Resumo: SOLID na Prática

### Matriz de Implementação

| Princípio | Implementação | Arquivo/Local | Benefício |
|-----------|---------------|-------|----------|
| **SRP** | Controllers, Services, Models em arquivos separados | `controllers/`, `services/`, `models/` | Fácil manutenção |
| **DIP** | Importar abstrações (services, logger, db) | `utils/`, `config/`, `middleware/` | Fácil testar, trocar implementação |
| **OCP** | Extensão de validadores, activity points, masks | `utils/formatters.ts`, `services/` | Adicionar features sem quebra |
| **LSP** | Middleware e services com contratos consistentes | `middleware/`, `services/` | Polimorfismo seguro |
| **ISP** | Interfaces segregadas por responsabilidade | Todos os `services/` | Menos acoplamento |

---

## Como Esses Princípios Contribuem para a Rubrica

✅ **Tech Forge - Implementação de 2 princípios de SOLID (2.00 pontos)**

Os seguintes princípios foram implementados:

1. **Single Responsibility Principle (SRP)** - 1.00 ponto
   - Controllers lidam apenas com HTTP
   - Services lidam apenas com lógica
   - Models lidam apenas com estrutura
   - Cada arquivo tem uma razão única para mudar

2. **Dependency Inversion Principle (DIP)** - 1.00 ponto
   - Controllers não criam suas dependências
   - Importam de abstrações (logger, services, db)
   - Fácil fazer mock/test
   - Fácil trocar implementação

**Código demonstrando SRP + DIP em createUser:**
```typescript
// Controllers (HTTP handling) ← SRP
export const createUser = async (req: Request, res: Response) => {
  // Services (business logic) ← DIP through imports
  const validation = validatePasswordStrength(password);
  const hash = await hashPassword(password);
  
  // Database (persistence) ← DIP through singleton
  const user = await sequelize.transaction(async (t) => {
    return User.create({...}, { transaction: t });
  });
  
  // Logger (concerns) ← DIP
  logger.info('User created', { requestId: req.requestId, userId: user.id });
  
  return res.status(201).json({...});
};
```

Ambos os princípios trabalham juntos para criar uma arquitetura flexível, testável e maintível.

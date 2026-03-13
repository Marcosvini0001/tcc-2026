# NeuroXP - Aplicativo de Gamificação

Aplicativo completo de gamificação para hábitos saudáveis, desenvolvido com React Native (Expo) no frontend e Node.js no backend.

## 🚀 Funcionalidades

### Autenticação
- Cadastro de usuário
- Login com email e senha
- JWT para autenticação
- bcrypt para criptografia de senha

### Sistema de XP e Níveis
- Cada tarefa concluída dá +50 XP
- Nível aumenta a cada 500 XP
- Barra de progresso visual

### Sistema de Tarefas
- 4 tarefas padrão:
  - Treinar durante 30 min
  - Acordar antes das 7h
  - Estudar por 1 hora
  - Ler por 20 min

### Sistema de Amigos
- Buscar usuários por nome
- Adicionar amigos
- Ranking entre amigos

### Telas
- Splash/Welcome
- Login
- Cadastro
- Dashboard (Home/Tarefas)
- Ranking
- Perfil

## 🛠️ Stack Tecnológica

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT + bcrypt
- TypeScript

### Frontend
- React Native + Expo
- React Navigation
- Axios
- Zustand (estado global)
- AsyncStorage

## 📁 Estrutura do Projeto

```
tcc-2026/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── server.ts
│   ├── package.json
│   └── .env
└── frontend/
    └── meuApp/
        ├── app/
        ├── src/
        │   ├── services/
        │   └── stores/
        ├── package.json
        └── ...
```

## 🚀 Como Rodar

### Pré-requisitos
- Node.js (v18+)
- MongoDB (local ou Atlas)
- Expo CLI

### Backend

1. Instalar dependências:
```bash
cd backend
npm install
```

2. Configurar MongoDB no `.env`:
```
MONGODB_URI=mongodb://localhost:27017/neuroxp
JWT_SECRET=your_secret_key
PORT=3000
```

3. Popular tarefas padrão:
```bash
npm run seed
```

4. Rodar o servidor:
```bash
npm run dev
```

### Frontend

1. Instalar dependências:
```bash
cd frontend/meuApp
npm install
```

2. Rodar o app:
```bash
npm start
# ou
expo start
```

## 📡 API Endpoints

### Auth
- `POST /auth/register` - Cadastrar usuário
- `POST /auth/login` - Fazer login

### User
- `GET /user/profile` - Perfil do usuário

### Tarefas
- `GET /tarefas` - Listar tarefas
- `POST /tarefas/concluir` - Concluir tarefa

### Amigos
- `GET /amigos/buscar?nome=` - Buscar usuários
- `POST /amigos/adicionar` - Adicionar amigo
- `GET /amigos/lista` - Listar amigos

### Ranking
- `GET /ranking` - Ranking de amigos

## 🎯 Regras de Negócio

- **XP por tarefa**: +50
- **XP por nível**: 500
- **Nível inicial**: 1
- **XP inicial**: 0

## 🔐 Segurança
- Senhas criptografadas com bcrypt
- Tokens JWT com expiração de 7 dias
- Middleware de autenticação em rotas protegidas

## 📱 Telas do App

1. **Welcome** - Tela inicial com logo
2. **Login** - Entrada com email/senha
3. **Register** - Cadastro de novo usuário
4. **Dashboard** - Home com tarefas e progresso
5. **Ranking** - Lista de amigos ordenada por XP
6. **Profile** - Perfil com estatísticas

## 🗄️ Banco de Dados

### Collections
- `users` - Usuários
- `tasks` - Tarefas padrão
- `taskhistories` - Histórico de tarefas concluídas

### Schema User
```javascript
{
  nome: String,
  email: String,
  senha: String, // hashed
  xp: Number,
  nivel: Number,
  amigos: [ObjectId],
  tarefasConcluidas: [ObjectId]
}
```

## 🔧 Desenvolvimento

### Scripts Disponíveis

#### Backend
- `npm run dev` - Rodar em modo desenvolvimento
- `npm run build` - Compilar TypeScript
- `npm run seed` - Popular tarefas padrão

#### Frontend
- `npm start` - Iniciar Expo
- `npm run android` - Rodar no Android
- `npm run ios` - Rodar no iOS

## 📝 Notas

- O app usa Expo Router para navegação
- Estado global gerenciado com Zustand
- API requests feitos com Axios
- Tokens salvos no AsyncStorage
- Design responsivo para mobile

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto é para fins educacionais.
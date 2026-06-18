# 🧠 NeuroXP

# ⚙️ Como Rodar o Projeto

## 1. Pré-requisitos
- Node.js instalado (versão recomendada: 18 ou superior)
- npm instalado
- MySQL rodando localmente

## 2. Backend
1. Abra um terminal em `backend`
2. Copie o arquivo de ambiente:
   - `cp .env.example .env` (no Windows PowerShell: `copy .env.example .env`)
3. Ajuste as variáveis de ambiente se necessário
4. Instale dependências:
   - `npm install`
5. Inicie o backend em modo desenvolvimento:
   - `npm run dev`

O servidor deve ficar disponível em:
- `http://localhost:3000`

## 3. Frontend
1. Abra um terminal em `frontend/meuApp`
2. Instale dependências:
   - `npm install`
3. Inicie o aplicativo Expo:
   - `npm run start`
4. Execute no emulador ou dispositivo conforme preferir:
   - `npm run android`
   - `npm run ios`
   - `npm run web`

> Se usar Android em emulador, o app se conecta ao backend em `http://10.0.2.2:3000`.

## 4. Testes
### Backend
- Executar testes unitários e de integração:
  - `npm test`

### Frontend
- Executar testes E2E no `meuApp`:
  - `cd frontend/meuApp`
  - `npm test`

---

# 🧪 Scripts Importantes
- `npm install` — instala dependências em cada pasta
- `npm run dev` — inicia o backend em modo de desenvolvimento
- `npm run start` — inicia o backend em modo normal
- `npm test` — executa testes do backend
- `npm run typecheck` — valida o TypeScript do backend
- `npm run start` (em `frontend/meuApp`) — inicia o Expo
- `npm run test` (em `frontend/meuApp`) — executa testes E2E do frontend

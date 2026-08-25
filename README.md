# Sistema de Gestão de Ordens de Serviço — IME

Projeto Final de Curso (PFC) — sistema web para registro, acompanhamento e gerenciamento de Ordens de Serviço da prefeitura do Instituto Militar de Engenharia.

## Stack

- **Backend:** NestJS 11 + Prisma 6 + PostgreSQL 16
- **Frontend:** Next.js 16 (App Router) + Tailwind v4
- **Banco:** Postgres em Docker
- **Monorepo:** npm workspaces

## Estrutura

```
PFC_Gestao_De_OS/
├── apps/
│   ├── backend/           NestJS + Prisma
│   └── frontend/          Next.js
├── docker-compose.yml     Banco Postgres
├── package.json           Workspaces + scripts raiz
└── .env.example           Variáveis de ambiente de exemplo
```

## Pré-requisitos

- Node.js 20+ e npm
- Docker Desktop

## Setup inicial

```bash
# 1. Subir o banco
docker compose up -d

# 2. Instalar dependências (raiz instala todos os workspaces)
npm install

# 3. Configurar variáveis de ambiente
cp .env.example apps/backend/.env

# 4. Aplicar migrations
cd apps/backend
npx prisma migrate deploy
```

## Rodando (banco + backend + frontend)

Um único comando sobe os três serviços. As migrations são aplicadas
automaticamente na subida do backend.

```bash
docker compose up          
```

- O código é montado nos containers (bind mount), então **hot-reload funciona**:
  editar um arquivo em `apps/` recompila dentro do container.
- Para reconstruir as imagens após mudar dependências: `docker compose build`.
- Para parar: `docker compose down` (adicione `-v` para apagar também o volume do banco).


## URLs

| Serviço        | URL                           |
|----------------|-------------------------------|
| Frontend       | http://localhost:3000         |
| Swagger        | http://localhost:3001/swagger |

## Funcionalidades

- Abertura e acompanhamento de Ordens de Serviço
- Histórico de alterações por OS
- Upload e download de anexos (imagens e PDF, até 10 MB)
- Dashboard com KPIs e estatísticas agregadas

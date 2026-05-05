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

## Rodando

Em terminais separados a partir da raiz do projeto:

```bash
npm run dev:backend   # porta 3001
npm run dev:frontend  # porta 3000
```

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

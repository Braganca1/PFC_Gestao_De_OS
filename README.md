# Sistema de Gestão de Ordens de Serviço — IME

Projeto Final de Curso (PFC) — sistema web para registro, acompanhamento e gerenciamento de Ordens de Serviço da prefeitura do Instituto Militar de Engenharia.

## Stack

- **Backend:** NestJS 11 + Prisma 6 + PostgreSQL 16
- **Frontend:** Next.js 16 (App Router) + Tailwind v4
- **Banco:** Postgres em Docker (porta `5433` — a `5432` está reservada para Postgres nativo do Windows)
- **Monorepo:** npm workspaces

## Estrutura

```
PFC_Gestao_De_OS/
├── apps/
│   ├── backend/       NestJS + Prisma
│   └── frontend/      Next.js
├── docker-compose.yml Postgres
├── package.json       Workspaces + scripts
├── .env.example       Variáveis de ambiente
└── postman_collection.json
```

## Pré-requisitos

- Node.js 20+ e npm
- Docker Desktop

## Setup inicial

```bash
# 1. Subir o banco
docker compose up -d

# 2. Instalar dependências (raiz instala os workspaces)
npm install

# 3. Configurar ambiente (copiar e editar se necessário)
cp .env.example apps/backend/.env

# 4. Aplicar migrations
cd apps/backend
npx prisma migrate deploy
```

## Rodando

Em terminais separados:

```bash
# Backend — http://localhost:3001/api
npm run dev:backend

# Frontend — http://localhost:3000
npm run dev:frontend
```
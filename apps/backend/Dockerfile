# syntax=docker/dockerfile:1
# Contexto de build: raiz do monorepo (ver docker-compose.yml)

# ---- deps: instala dependências do workspace e gera o Prisma Client ----
FROM node:20-alpine AS deps
WORKDIR /app
# manifests primeiro para aproveitar o cache de camadas
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN npm install
# Prisma Client precisa do schema para ser gerado
COPY apps/backend/prisma ./apps/backend/prisma
RUN npx prisma generate --schema apps/backend/prisma/schema.prisma

# ---- dev: hot-reload (usado pelo docker-compose de desenvolvimento) ----
FROM deps AS dev
WORKDIR /app/apps/backend
EXPOSE 3001
CMD ["npm", "run", "start:dev"]

# ---- build: compila para produção ----
FROM deps AS build
COPY . .
RUN npm run build --workspace=apps/backend

# ---- prod: runtime enxuto (usado em produção) ----
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/package.json ./apps/backend/package.json
COPY --from=build /app/apps/backend/prisma ./apps/backend/prisma
WORKDIR /app/apps/backend
EXPOSE 3001
# em produção, aplicar migrations antes de subir:
# sh -c "npx prisma migrate deploy && node dist/main"
CMD ["node", "dist/main"]

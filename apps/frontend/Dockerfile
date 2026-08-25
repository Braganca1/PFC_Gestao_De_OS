# syntax=docker/dockerfile:1
# Contexto de build: raiz do monorepo (ver docker-compose.yml)

# ---- deps: instala dependências do workspace ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN npm install

# ---- dev: hot-reload (usado pelo docker-compose de desenvolvimento) ----
FROM deps AS dev
WORKDIR /app/apps/frontend
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- build: compila para produção ----
FROM deps AS build
COPY . .
RUN npm run build --workspace=apps/frontend

# ---- prod: serve o build de produção ----
# OBS.: para produção real, habilitar `output: "standalone"` no next.config.ts
# e copiar apenas .next/standalone — reduz muito o tamanho da imagem.
FROM deps AS prod
WORKDIR /app/apps/frontend
ENV NODE_ENV=production
COPY --from=build /app/apps/frontend/.next ./.next
EXPOSE 3000
CMD ["npm", "run", "start"]

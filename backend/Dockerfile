# syntax=docker/dockerfile:1

# Imagen de producción del API Gateway.
#
# Se compila en una etapa y se ejecuta en otra: la imagen final no lleva
# el compilador de TypeScript, ni el CLI de Nest, ni las dependencias de
# desarrollo. Sólo dist/ y lo que hace falta para servir.
#
# Base Debian slim y no Alpine a propósito: el lock trae bindings
# nativos compilados contra glibc y no existe variante musl.

ARG NODE_VERSION=24-bookworm-slim

# ── Dependencias completas (incluye las de desarrollo, para compilar) ──
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Compilación: src/ -> dist/ ──
FROM node:${NODE_VERSION} AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

# ── Dependencias de ejecución solamente ──
FROM node:${NODE_VERSION} AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ── Imagen final ──
FROM node:${NODE_VERSION} AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

# El usuario `node` viene en la imagen base y no es root: si alguien
# sale del proceso, no sale como administrador del contenedor.
USER node

EXPOSE 3000

# La sonda pega en /api/health, que además de responder informa el
# estado de Postgres y Redis. Comprobar sólo el puerto no bastaba: un
# proceso que acepta conexiones pero no responde HTTP se veía sano.
# Ese endpoint queda fuera del límite por IP a propósito, o la sonda
# se comería el cupo del visitante.
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "require('http').get({host:'127.0.0.1',port:Number(process.env.PORT||3000),path:'/api/health',timeout:4000},r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/main"]

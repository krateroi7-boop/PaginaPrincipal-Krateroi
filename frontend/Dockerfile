# syntax=docker/dockerfile:1

# Imagen de producción del sitio.
#
# Vite escribe las variables VITE_ literales dentro del paquete: no son
# configuración de ejecución sino de compilación. Por eso entran como
# build args y por eso cambiar el dominio del sitio obliga a reconstruir
# esta imagen (no a reiniciar el contenedor).
#
# El resultado lo sirve nginx, que además publica el backend bajo /api
# del mismo origen: el navegador habla siempre con una sola dirección.

ARG NODE_VERSION=24-bookworm-slim

# ── Compilación del sitio ──
FROM node:${NODE_VERSION} AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL
ARG VITE_WHATSAPP=
ARG VITE_WHATSAPP_VISIBLE=
ARG VITE_CORREO=
ARG VITE_MENSAJE_WHATSAPP=Hola, quiero conversar un proyecto.

# `.env.production.local` es el archivo de mayor prioridad de Vite: gana
# sobre cualquier .env que se haya colado en el contexto de build. La
# dirección del backend se normaliza sin la barra final, porque el
# frontend la concatena con "/api/..." y "http://sitio//api" no cruza el
# proxy.
RUN test -n "$VITE_API_BASE_URL" || { echo "ERROR: falta el build arg VITE_API_BASE_URL"; exit 1; } && \
    { \
      echo "VITE_API_BASE_URL=\"$(echo "$VITE_API_BASE_URL" | sed 's:/*$::')\""; \
      echo "VITE_WHATSAPP=\"${VITE_WHATSAPP}\""; \
      echo "VITE_WHATSAPP_VISIBLE=\"${VITE_WHATSAPP_VISIBLE}\""; \
      echo "VITE_CORREO=\"${VITE_CORREO}\""; \
      echo "VITE_MENSAJE_WHATSAPP=\"${VITE_MENSAJE_WHATSAPP}\""; \
    } > .env.production.local && \
    npm run build && \
    node nginx/generar-csp.mjs dist nginx/csp.conf

# ── Imagen final: sólo el sitio compilado y nginx ──
FROM nginx:1.27-alpine AS runtime

COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY nginx/cabeceras-seguridad.conf /etc/nginx/snippets/cabeceras-seguridad.conf
COPY nginx/cloudflare-real-ip.conf /etc/nginx/snippets/cloudflare-real-ip.conf
# La CSP se calcula durante el build sobre el dist, no se escribe a mano.
COPY --from=build /app/nginx/csp.conf /etc/nginx/snippets/csp.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --spider --tries=1 http://127.0.0.1/ || exit 1

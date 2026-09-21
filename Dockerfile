# Imagen del frontend de Corazón Migrante.
#
# El proyecto compila con `output: "export"` (Next.js genera HTML estático en `out/`),
# así que la imagen final NO ejecuta Node: sirve ficheros con nginx. Eso la deja en
# unas decenas de megabytes y sin proceso que vigilar.
#
# Importante: las variables NEXT_PUBLIC_* se incrustan durante `next build`, no se
# leen al arrancar el contenedor. Por eso llegan como ARG y hay que reconstruir la
# imagen para cambiarlas (por ejemplo, al apuntar a la API de producción).

# ---------------------------------------------------------------------------
# 1. Dependencias
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS deps
WORKDIR /app

RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

# ---------------------------------------------------------------------------
# 2. Build estático
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS builder
WORKDIR /app

RUN corepack enable
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# `.env` queda fuera de la imagen (está en .dockerignore: no se versiona y contiene
# credenciales de las cuentas de prueba). La base son los valores públicos de
# `.env.example` —URLs de Cloudinary, textos, banderas— y encima mandan las ENV de
# abajo, porque Next no pisa una variable que ya venga del entorno.
RUN cp .env.example .env

# Valores por defecto pensados para `docker compose up` en local. En un despliegue
# real se pasan con `--build-arg`.
ARG NEXT_PUBLIC_APP_NAME="Corazon Migrante"
ARG NEXT_PUBLIC_APP_URL="http://localhost:8080"
ARG NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"
ARG NEXT_PUBLIC_PUBLIC_VIEW_SLUG="inicio"
ARG NEXT_PUBLIC_CMS_LIBRARY_SLUG="biblioteca"

ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_PUBLIC_VIEW_SLUG=$NEXT_PUBLIC_PUBLIC_VIEW_SLUG \
    NEXT_PUBLIC_CMS_LIBRARY_SLUG=$NEXT_PUBLIC_CMS_LIBRARY_SLUG \
    NEXT_TELEMETRY_DISABLED=1

RUN yarn build

# ---------------------------------------------------------------------------
# 3. Runtime
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runner

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/out /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

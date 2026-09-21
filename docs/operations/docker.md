# Docker

## Qué levanta

`docker-compose.yml` arranca la plataforma entera en local:

| Servicio   | Imagen                       | Puerto en el host |
| ---------- | ---------------------------- | ----------------- |
| `web`      | este repositorio (`Dockerfile`) | `8080`         |
| `api`      | `corazonmigranteBackend`     | `3000`            |
| `postgres` | `postgres:16-alpine`         | — (solo interno)  |
| `redis`    | `redis:7-alpine`             | — (solo interno)  |

```bash
docker compose up --build
# web  → http://localhost:8080
# api  → http://localhost:3000/api/v1
```

El backend vive en otro repositorio y se espera como carpeta hermana. Si está en
otra ruta:

```bash
BACKEND_CONTEXT=/ruta/al/backend docker compose up --build
```

Ni Postgres ni Redis publican puertos, y ningún servicio fija `container_name`. Es
deliberado: el repositorio del backend trae su propio `docker-compose.yml` con esos
mismos nombres y puertos, y así las dos pilas pueden convivir. Si los puertos 8080 o
3000 están ocupados: `WEB_PORT=8081 API_PORT=3001 docker compose up`.

## La imagen del frontend

El proyecto compila con `output: "export"`: `next build` deja HTML estático en `out/`
y la imagen final es un **nginx**, sin Node ni proceso de servidor. Pesa decenas de
megabytes en lugar de cientos.

Dos consecuencias prácticas:

1. **Las variables `NEXT_PUBLIC_*` se incrustan en el bundle durante el build.** No se
   leen al arrancar el contenedor. Cambiar la URL de la API exige reconstruir:

   ```bash
   docker compose build web   # o docker build --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.midominio.com .
   ```

2. **`.env` no entra en la imagen** (está en `.dockerignore`): no se versiona y
   contiene las credenciales de las cuentas de prueba. La base son los valores
   públicos de `.env.example` y encima mandan los `--build-arg`.

`docker/nginx.conf` sirve las rutas anidadas. El proyecto usa `trailingSlash: true`,
así que cada ruta es una carpeta con su `index.html`; sin el `try_files` de ese
fichero, recargar `/admin/contenido/paginas/` daría 404. El último salto es `=404`
—y no el fichero `/404.html` directamente— para que una URL inexistente responda con
código 404 y no con un 200 que engañaría a buscadores y monitorización.

## Despliegue

Para un dominio real hay que pasar al menos estas dos variables en el build:

```bash
docker build \
  --build-arg NEXT_PUBLIC_APP_URL=https://corazonmigrante.example \
  --build-arg NEXT_PUBLIC_API_BASE_URL=https://api.corazonmigrante.example \
  -t corazon-migrante-web:1.0.0 .
```

Y en el backend, `CORS_ORIGINS` tiene que incluir el dominio de la web: si no, cada
petición del panel muere en el preflight y la interfaz aparece vacía sin error claro.

Los secretos JWT del `docker-compose.yml` son valores de desarrollo. En producción
llegan del gestor de secretos del entorno, nunca de un fichero versionado.

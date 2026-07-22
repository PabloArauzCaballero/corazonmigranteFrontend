# Corazón Migrante Frontend — Reingeniería Next.js

Base nueva del frontend de **Corazón Migrante**, implementada desde cero con Next.js 15, TypeScript strict, Tailwind CSS, TanStack Query, React Hook Form, Zod y Jest.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript strict
- Tailwind CSS
- Componentes estilo shadcn/Radix
- TanStack Query
- React Hook Form + Zod
- Middleware + guards de cliente
- Jest + Testing Library
- ESLint + Prettier

## Instalación

```bash
yarn install
cp .env.example .env.local
yarn dev
```

Por defecto, `yarn dev` intenta levantar el frontend en `http://localhost:4173`. Si el puerto está ocupado, busca automáticamente el siguiente puerto libre.

El frontend requiere backend configurado. No se incluye modo de datos inventados para producción.

```bash
NEXT_PUBLIC_APP_URL=http://localhost:4173
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

## Comandos de calidad

```bash
yarn lint
yarn typecheck
yarn test:unit
yarn build
yarn test:smoke
```

Validación completa local/CI sin backend real:

```bash
yarn test:ci
```

Validación de integración real contra backend:

```bash
BACKEND_INTEGRATION_BASE_URL=http://localhost:3000 yarn test:integration:backend
```

Esta prueba falla si no existe URL de backend configurada. No usa mocks ni fixtures locales.

## Arquitectura

```txt
src/app              Rutas App Router
src/features         Módulos de negocio
src/shared/api       Cliente API, endpoints, normalizadores y errores
src/shared/auth      Sesión normalizada, roles y guards
src/shared/ui        Componentes base reutilizables
tests/unit           Unitarias Jest
tests/integration    Integración real contra backend
docs                 Arquitectura, seguridad, API, testing y pendientes
```

## Rutas principales

- `/`: landing pública
- `/login`: login paciente
- `/registro`: registro paciente
- `/booking`: solicitud de cita
- `/paciente`: portal paciente
- `/terapeuta`: portal terapeuta
- `/admin`: panel operativo
- `/admin/contabilidad`: contabilidad protegida

## Decisiones importantes

- Se elimina la duplicidad de rutas administrativas del frontend anterior.
- `role` y `permissions` son la fuente de verdad normalizada del frontend.
- No se usa `sessionStorage` como cache de negocio.
- No quedan tablas de negocio con filas hardcodeadas.
- Las tablas administrativas consultan backend con búsqueda/filtros/paginación server-side.
- Los pendientes quedan documentados en Markdown.

## Componentes de infraestructura

### Error Boundary

`src/shared/ui/error-boundary.tsx` — envuelve secciones que pueden fallar en render:

```tsx
import { ErrorBoundary } from "@/shared/ui/error-boundary";

<ErrorBoundary>
  <FeatureComponent />
</ErrorBoundary>
```

En producción muestra un mensaje genérico + botón "Reintentar". En desarrollo muestra el mensaje de la excepción.

### Loading states

Cada ruta pública tiene un `loading.tsx` que Next.js usa como fallback Suspense automático:

| Ruta | Skeleton |
|------|---------|
| `/noticias` | Grid de 6 tarjetas animadas |
| `/novedades` | Artículo destacado + grid |
| `/booking` | Paso a paso con campos |
| `/biblioteca` | Grid de 8 fichas |

### Sitemap y robots

- `src/app/sitemap.ts` → Next.js genera `/sitemap.xml` al build
- `src/app/robots.ts` → genera `/robots.txt` (bloquea `/admin/`, `/paciente/`, `/terapeuta/`)

Para actualizar la URL base, edita `NEXT_PUBLIC_APP_URL` en `.env`.

## Pendientes

Revisar `docs/pending/pending-items.md` antes de ajustar endpoints definitivos.


## CI/CD — GitHub Actions

El pipeline está en `.github/workflows/ci.yml` con tres jobs:

| Job | Trigger | Qué hace |
|-----|---------|----------|
| `quality` | Todo PR / push | Lint + typecheck |
| `test` | Tras `quality` | Unit tests (Jest) |
| `build` | Tras `quality` | `next build` — verifica que compila |

El build se sube como artefacto en pushes a `main` (retención 3 días).

Variables de entorno requeridas en CI (añadir como **secrets del repositorio** para producción):

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL del backend API |
| `NEXT_PUBLIC_APP_URL` | URL pública del frontend |
| `NEXT_PUBLIC_PUBLIC_ASSETS_BASE_URL` | Base URL de assets (Cloudinary) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloud name de Cloudinary |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Upload preset de Cloudinary |

## Segunda revisión

Ver `SECOND_REVIEW_REPORT.md` para el detalle de la validación adicional contra el backend real y las correcciones aplicadas.


## Landing configurable por Vistas Públicas

La home `/` no usa mockups. Carga la configuración desde el backend usando la capa:

```txt
src/features/public-view/public-view.api.ts
```

Por defecto, la landing principal se carga por slug publico:

```env
NEXT_PUBLIC_PUBLIC_VIEW_SLUG=inicio
```

Eso llama a:

```txt
GET /api/v1/public/pages/inicio
```

La biblioteca usa el mismo contrato con el slug `biblioteca`:

```txt
GET /api/v1/public/pages/biblioteca
GET /api/v1/public/pages/:slug/elements/:code
```

Si el backend no devuelve la vista configurada, la landing muestra un error claro y no renderiza contenido inventado.

## Cloudflare Pages

Para Cloudflare Pages usar:

- Build command: `yarn build`
- Build output directory: `out`
- Framework preset: `Next.js (Static HTML Export)`

No usar `dist`. Next.js con `output: "export"` genera `out` durante el build.

La landing publica se prerenderiza al momento del deploy. Configura
`NEXT_PUBLIC_API_BASE_URL` y las variables `NEXT_PUBLIC_PUBLIC_VIEW_*` en
Cloudflare Pages para que el HTML exportado use el backend correcto.

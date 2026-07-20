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
| `build` | Tras `quali
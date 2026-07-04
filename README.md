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

## Pendientes

Revisar `docs/pending/pending-items.md` antes de ajustar endpoints definitivos.


## Segunda revisión

Ver `SECOND_REVIEW_REPORT.md` para el detalle de la validación adicional contra el backend real y las correcciones aplicadas.


## Landing configurable por Vistas Públicas

La home `/` no usa mockups. Carga la configuración desde el backend usando la capa:

```txt
src/features/public-view/public-view.api.ts
```

Por defecto, para respetar el flujo real de Vistas Públicas, la variable histórica `NEXT_PUBLIC_PUBLIC_VIEW_SLUG` puede contener el ID de la vista:

```env
NEXT_PUBLIC_PUBLIC_VIEW_MODE=public-view-id
NEXT_PUBLIC_PUBLIC_VIEW_SLUG=1
NEXT_PUBLIC_PUBLIC_VIEW_ID=
```

Eso llama a:

```txt
GET /api/v1/public-views/1
```

También se soportan:

```txt
GET /api/v1/public/pages/:slug
GET /api/v1/public/pages/by-id/:id
GET /api/v1/public/pages/:slug/elements/:code
GET /api/v1/public/page-elements/:id
GET /api/v1/public-views/:id
GET /api/v1/public-views/:id/elements/:code
```

Para cambiar el modo:

```env
NEXT_PUBLIC_PUBLIC_VIEW_MODE=page-by-id
NEXT_PUBLIC_PUBLIC_VIEW_ID=1
```

O para slug real:

```env
NEXT_PUBLIC_PUBLIC_VIEW_MODE=page-slug
NEXT_PUBLIC_PUBLIC_VIEW_SLUG=inicio
```

Si el backend no devuelve la vista configurada, la landing muestra un error claro y no renderiza contenido inventado.

## Cloudflare Pages

Para Cloudflare Pages usar:

- Build command: `yarn build`
- Build output directory: `out`
- Framework preset: `Next.js (Static HTML Export)`

No usar `dist`; Next.js con `output: "export"` genera `out`.

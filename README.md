# Corazón Migrante Frontend — Reingeniería Next.js

Base nueva del frontend de **Corazón Migrante**, implementada desde cero con Next.js 15, TypeScript strict, Tailwind CSS, TanStack Query, React Hook Form y Zod.

## Stack

- Next.js 15 App Router
- React 19
- TypeScript strict
- Tailwind CSS
- Componentes estilo shadcn/Radix
- TanStack Query
- React Hook Form + Zod
- Middleware + guards de cliente
- ESLint + Prettier

## Instalación

```bash
npm install
cp .env.example .env.local
npm run dev
```

Para probar pantallas sin backend:

```bash
NEXT_PUBLIC_ENABLE_DEMO_MODE=true npm run dev
```

## Comandos de calidad

```bash
npm run lint
npm run typecheck
npm run build
npm run test:smoke
```

## Arquitectura

```txt
src/app              Rutas App Router
src/features         Módulos de negocio
src/shared/api       Cliente API, endpoints y errores
src/shared/auth      Sesión normalizada, roles y guards
src/shared/ui        Componentes base reutilizables
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
- Las tablas quedan preparadas para búsqueda/filtros/paginación server-side.
- Los pendientes quedan documentados en Markdown.

## Pendientes

Revisar `docs/pending/pending-items.md` antes de conectar al backend real.

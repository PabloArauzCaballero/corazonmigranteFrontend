# Reporte de implementación — Corazón Migrante Frontend

## Resultado

Se implementó una base nueva del frontend desde cero con Next.js 15, TypeScript strict, Tailwind CSS, TanStack Query, React Hook Form y Zod.

## Cambios principales

- Nueva arquitectura App Router por zonas: público, paciente, terapeuta y admin.
- Sesión normalizada con `role` y `permissions` centralizados.
- Middleware y guards de cliente para proteger rutas.
- Rutas administrativas canónicas sin duplicidad `/portal-admin` ni `/auth/admin/login`.
- Cliente API centralizado, errores humanos y endpoints tipados en un solo archivo.
- Formularios base con React Hook Form + Zod para login, registro y booking.
- UI profesional sobria, responsive y accesible.
- Tablas base con estructura preparada para server-side search, filtros y paginación.
- Documentación de rutas, API, seguridad, testing, supuestos y pendientes.
- Smoke test estático para validar rutas, docs y endpoints críticos.
- Playwright configurado para e2e cuando se instale navegador Chromium.

## Validación ejecutada

```bash
npm install --no-audit --no-fund
npm run lint
npm run typecheck
npm run build
npm run test:smoke
```

Estado:

- `npm run lint`: OK.
- `npm run typecheck`: OK.
- `npm run build`: OK.
- `npm run test:smoke`: OK.

## Pendientes importantes

Ver `docs/pending/pending-items.md`.

Los más importantes son:

- Confirmar contrato real del backend.
- Confirmar flujo final de booking.
- Confirmar permisos reales de contabilidad.
- Confirmar textos legales finales.
- Confirmar CMS público editable.

## Nota técnica

El modo demo se activa únicamente con:

```bash
NEXT_PUBLIC_ENABLE_DEMO_MODE=true
```

En producción debe mantenerse en `false`.

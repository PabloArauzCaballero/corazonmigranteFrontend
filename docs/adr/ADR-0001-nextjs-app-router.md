# ADR-0001: Next.js 15 con App Router

## Estado

**Aceptado** — documenta el estado observado el 2026-08-03.

## Contexto

El proyecto es una reescritura: el README lo titula *«Corazón Migrante Frontend — Reingeniería Next.js»* y `docs/architecture/assumptions.md` registra `SUPUESTO_CM: Frontend reconstruido desde cero`.

## Fuerzas y restricciones

- Cinco portales distintos (público, paciente, terapeuta, admin, contabilidad) con navegación y layouts propios.
- Necesidad de rutas públicas indexables junto a portales privados.
- Backend independiente que ya resuelve datos y autorización.
- Despliegue estático (ver [ADR-0002](ADR-0002-exportacion-estatica.md)).

## Opciones consideradas

| Opción | Ventajas | Inconvenientes |
|---|---|---|
| **Next.js 15 App Router** (elegida) | Layouts anidados, fronteras de error por segmento, prerenderizado, convenciones establecidas | Curva de Server/Client Components; con `output: "export"` se pierden capacidades |
| Next.js Pages Router | Más simple y conocido | Sin layouts anidados ni `error.tsx` por segmento |
| Vite + React Router | Ligero y flexible | Todo el andamiaje a mano: rutas, prerenderizado, metadatos |

## Decisión

Next.js **15.4.7** con App Router y React **19.2.0**, ambas versiones **fijadas sin `^`** en `package.json`.

## Consecuencias positivas

- **Layouts anidados** resuelven limpiamente los tres portales: cada uno aplica su `ClientRoleGuard` una sola vez, en su layout.
- **`error.tsx` por segmento**: un fallo en `/admin` no afecta a `/paciente`.
- **`loading.tsx`** en 11 rutas, sin código adicional.
- Metadatos declarativos con plantilla (`"%s | Corazón Migrante"`).
- `next/font` autoaloja las fuentes en build.
- Prerenderizado de 69 rutas sin trabajo extra.

La estructura de layouts es el beneficio más tangible: los tres portales se protegen con tres líneas, y una ruta nueva bajo `admin/` hereda la protección automáticamente.

## Consecuencias negativas

- Fijar `next` sin `^` obliga a actualizar a mano — es deliberado y correcto para un framework.
- La frontera Server/Client Component es una fuente real de errores de hidratación (ver [runbooks/error-de-hidratacion.md](../operations/runbooks/error-de-hidratacion.md)).
- Con `output: "export"` gran parte del valor del App Router (RSC con datos, middleware, Route Handlers) **no se aprovecha**.

La última merece énfasis: se paga la complejidad del App Router sin obtener sus capacidades de servidor. La contrapartida —layouts, fronteras de error, prerenderizado, metadatos— sigue justificándolo, pero la relación no es tan favorable como en un despliegue con servidor.

## Riesgos

| Riesgo | Severidad |
|---|---|
| Errores de hidratación por acceso a `window` en render | MEDIUM — mitigado por `reactStrictMode` y el lint |
| Cualquier Route Handler nuevo no se exportará, sin aviso | MEDIUM |
| Actualizar Next.js 15 → 16 exigirá nueva línea base completa | MEDIUM |

## Evidencia

- [package.json](../../package.json) — `next: "15.4.7"`, `react: "19.2.0"` sin `^`
- Estructura `src/app/` con 5 layouts, 7 fronteras de error, 11 `loading.tsx`
- Salida de `next build`: 69 rutas
- [README.md](../../README.md) — «Reingeniería Next.js»

## Plan de revisión

Revisar al aparecer Next.js 16 estable o si se decide abandonar `output: "export"`, momento en el que el balance de esta decisión mejoraría notablemente.

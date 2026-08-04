# Entornos

- **Fecha de evidencia:** 2026-08-03

## 1. Los dos entornos reales

| | Desarrollo | Producción |
|---|---|---|
| Ejecución | `next dev` vía `scripts/dev-auto-port.mjs` | HTML estático en Cloudflare Pages |
| Puerto | 4173 (o el primero libre) | 443 |
| Route Handlers `/api/*` | ✅ Funcionan | ❌ **No existen** |
| `middleware.ts` | ✅ Se ejecuta | ❌ No se ejecuta |
| Cabeceras de `_headers` | ❌ **No se aplican** | ✅ Se aplican |
| Telemetría | `/api/otel/traces` (Route Handler) | `/otel/v1/traces` (Pages Function) |
| `logs/api-requests.log` | ✅ Se escribe | ❌ Desactivado por `NODE_ENV` |
| Optimización de imágenes | ❌ `unoptimized` | ❌ `unoptimized` |

**No hay entorno de staging documentado en el repositorio.** Brecha `OPS-04`.

## 2. Las tres asimetrías que causan fallos

Son la fuente de los errores más difíciles de diagnosticar del proyecto: **funciona en local, falla en producción**.

### a) Las cabeceras de seguridad no existen en local

La CSP, HSTS, `X-Frame-Options` y `Cache-Control` solo se aplican en Cloudflare Pages. Una petición hacia un host nuevo funcionará perfectamente en `next dev` y será **bloqueada por `connect-src` en producción**.

Runbook: [runbooks/csp-bloquea-peticiones.md](runbooks/csp-bloquea-peticiones.md).

### b) El middleware se ejecuta en local y no en producción

En `next dev`, un rol insuficiente produce un `rewrite` a `/403`. En producción, produce `ForbiddenState` del guard en la misma URL. **Son comportamientos distintos**, y probar el control de acceso en local no valida el de producción.

### c) Los Route Handlers existen en local

`/api/debug-log` y `/api/otel/traces` funcionan en `next dev` y desaparecen en producción. El código lo tiene en cuenta explícitamente (guarda de `NODE_ENV` en `logApiCall()`, Pages Function para telemetría), pero cualquier Route Handler nuevo caería en la misma trampa **sin aviso**: el build no falla, la ruta simplemente no se exporta.

## 3. Arranque en desarrollo

`scripts/dev-auto-port.mjs` busca un puerto libre a partir del 4173. Existe porque el backend suele ocupar el 3000 y `client.ts` **rechaza explícitamente** que `NEXT_PUBLIC_API_BASE_URL` apunte al propio origen del frontend:

> *«NEXT_PUBLIC_API_BASE_URL está apuntando a la aplicación frontend. Este proyecto corre por defecto en 4173; configura el servidor en otro puerto, por ejemplo NEXT_PUBLIC_API_BASE_URL=http://localhost:3000.»*

## 4. Configuración por entorno

Todas las variables llevan prefijo `NEXT_PUBLIC_` y se **incrustan en el bundle en build**.

| Entorno | Origen |
|---|---|
| Desarrollo | `.env` / `.env.local` (ambos en `.gitignore`) |
| CI | Bloque `env` de cada job en `ci.yml` — ⚠️ **con nombres obsoletos**, ver [deployment.md §5](deployment.md) |
| Producción | Panel de Cloudflare Pages |

**Consecuencia estructural:** no existe configuración en tiempo de ejecución. Cambiar cualquier variable exige reconstruir y volver a desplegar.

Plantilla en [.env.example](../../.env.example). Detalle en [../getting-started/environment-variables.md](../getting-started/environment-variables.md).

## 5. Recomendación

Un entorno de staging con la **misma** configuración de Cloudflare Pages que producción (incluidos `_headers` y la Pages Function) eliminaría las tres asimetrías del §2 como fuente de incidentes. Es hoy el único modo de validar la CSP antes de publicar.

`OPS-04`, severidad MEDIUM. Es una decisión de infraestructura, no de código.

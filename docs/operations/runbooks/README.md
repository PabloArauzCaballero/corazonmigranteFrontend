# Runbooks

- **Fecha de evidencia:** 2026-08-03

Cada runbook sigue la misma estructura: **síntoma · impacto · diagnóstico seguro · evidencia · mitigación · rollback · escalado**.

> ⚠️ **La columna «escalado» está incompleta a propósito.** El repositorio no define roles de guardia ni contactos. Ver [../../security/incident-response.md §6](../../security/incident-response.md) y brecha `OPS-05`.

## Índice

| # | Runbook | Síntoma |
|---:|---|---|
| 1 | [app-no-carga.md](app-no-carga.md) | La aplicación no carga en absoluto |
| 2 | [pantalla-en-blanco.md](pantalla-en-blanco.md) | HTML sirve pero no se pinta nada |
| 3 | [chunks-fallidos.md](chunks-fallidos.md) | `ChunkLoadError` tras un despliegue |
| 4 | [backend-no-disponible.md](backend-no-disponible.md) | Todas las pantallas con datos fallan |
| 5 | [autenticacion-en-bucle.md](autenticacion-en-bucle.md) | Redirección infinita al login |
| 6 | [csp-bloquea-peticiones.md](csp-bloquea-peticiones.md) | Funciona en local, falla en producción |
| 7 | [faltan-cabeceras-seguridad.md](faltan-cabeceras-seguridad.md) | Sin CSP ni HSTS en producción |
| 8 | [imagenes-no-disponibles.md](imagenes-no-disponibles.md) | Imágenes rotas o de respaldo |
| 9 | [variables-entorno-incorrectas.md](variables-entorno-incorrectas.md) | Comportamiento inesperado tras desplegar |
| 10 | [error-de-hidratacion.md](error-de-hidratacion.md) | Aviso de *hydration mismatch* |
| 11 | [build-manifest-enoent.md](build-manifest-enoent.md) | El build falla con `ENOENT` sobre manifiestos |
| 12 | [degradacion-web-vitals.md](degradacion-web-vitals.md) | La aplicación se percibe lenta |
| 13 | [rollback-de-release.md](rollback-de-release.md) | Hay que volver a la versión anterior |

## Principio general

**Con Cloudflare Pages, el rollback es la mitigación más rápida de casi todo.** Volver al despliegue anterior no requiere reconstruir y es reversible. Ante duda y con impacto sobre personas usuarias: revertir primero, diagnosticar después.

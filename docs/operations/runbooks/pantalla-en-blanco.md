# Runbook — Pantalla en blanco

## Síntoma

El HTML se sirve (`200`) pero no se pinta nada, o solo el fondo. Sin mensaje de error visible.

## Impacto

Bloqueo total de la ruta afectada.

## Por qué es especialmente grave aquí

Con `output: "export"`, el HTML **está prerenderizado**: debería verse el esqueleto de la página incluso sin JavaScript. Una pantalla completamente en blanco significa que falló algo muy temprano: el layout raíz, los providers o el propio HTML.

## Diagnóstico seguro

1. **Consola del navegador** — es donde estará la causa.
2. **Network** — ¿cargaron el HTML, el CSS y los chunks?
3. **Ver código fuente** (`Ctrl+U`) — si el HTML llega con contenido, el fallo es de hidratación; si llega vacío, el fallo es del artefacto.

```bash
# ¿El HTML tiene contenido?
curl -s https://DOMINIO/paciente/ | wc -c
curl -s https://DOMINIO/paciente/ | grep -c "contenido-principal"
```

## Causas por orden de probabilidad

| # | Causa | Indicio | Runbook |
|---:|---|---|---|
| 1 | Error en `global-error.tsx` o en un provider | Excepción en consola durante la hidratación | — |
| 2 | Chunk que no carga | `ChunkLoadError` o `404` en Network | [chunks-fallidos.md](chunks-fallidos.md) |
| 3 | CSP bloqueando el script | `Refused to load the script` | [csp-bloquea-peticiones.md](csp-bloquea-peticiones.md) |
| 4 | Artefacto incompleto | HTML vacío o `404` en `/_next/static/*` | — |
| 5 | Error de validación de entorno | `ZodError` en consola | [variables-entorno-incorrectas.md](variables-entorno-incorrectas.md) |
| 6 | Error de hidratación grave | Aviso de *hydration mismatch* | [error-de-hidratacion.md](error-de-hidratacion.md) |

**La causa 1 es la más habitual.** `AppProviders` monta seis providers; una excepción en cualquiera de ellos impide renderizar todo el árbol. `global-error.tsx` debería capturarla —y por eso debe renderizar su propio `<html>` y `<body>`—, pero si el fallo ocurre antes de que React monte, no hay frontera que lo capture.

**La causa 5 tiene un matiz importante:** `envSchema.parse()` se ejecuta al importar el módulo. Un entorno inválido normalmente **rompe el build**, no la ejecución. Si llega a producción, es que la variable difería entre build y ejecución — imposible con `NEXT_PUBLIC_*`, que se incrustan en build. Por eso esta causa es poco probable aquí.

## Evidencia a recoger

- Captura completa de la consola.
- Cabeceras de respuesta y tamaño del HTML.
- Lista de recursos con `404` en Network.
- Ruta afectada y si otras funcionan.

## Mitigación

Si el fallo llegó con un despliegue: **rollback inmediato**.

Si es una ruta concreta, aislar qué cambió en ella y reproducir en local con `yarn build && npx serve out`.

## Rollback

Volver al despliegue anterior en Cloudflare Pages.

## Prevención

1. `yarn test:smoke` verifica la existencia de rutas críticas antes de desplegar.
2. Smoke posterior al despliegue sobre las rutas principales (brecha `OPS-03`).
3. Verificar que el artefacto contiene los archivos esperados: `ls out/index.html out/_headers`.

## Escalado

Sin definir en el repositorio (`OPS-05`).

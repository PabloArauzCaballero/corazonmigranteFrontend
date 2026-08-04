# Runbook — Chunks desactualizados o fallidos

## Síntoma

```
ChunkLoadError: Loading chunk 5964 failed.
(error: https://DOMINIO/_next/static/chunks/5964-fee80267d284c734.js)
```

Aparece en pestañas abiertas **antes** de un despliegue, al navegar a una ruta cuyo chunk ya no existe.

## Impacto

La navegación falla en las pestañas antiguas. Recargar lo resuelve. Nuevas visitas no se ven afectadas.

## Causa

Los bundles llevan hash en el nombre (`5964-fee80267d284c734.js`). Un despliegue nuevo genera hashes nuevos y **retira los antiguos**. Una pestaña con el HTML anterior sigue pidiendo los chunks viejos.

`/_next/static/*` se sirve con `Cache-Control: public, max-age=31536000, immutable`, lo cual es correcto —el contenido de un hash nunca cambia— pero no evita que el archivo desaparezca del origen.

## Diagnóstico seguro

```bash
# ¿Existe el chunk que falla?
curl -s -o /dev/null -w "%{http_code}\n" https://DOMINIO/_next/static/chunks/<nombre>.js
```

`404` en un chunk + despliegue reciente = este caso.

Si el `404` afecta a **todos** los chunks, incluidos los del HTML actual, el problema es otro: artefacto incompleto. Ver [pantalla-en-blanco.md](pantalla-en-blanco.md).

## Evidencia a recoger

- Nombre del chunk y código de estado.
- Hora del último despliegue frente a hora del error.
- Si ocurre solo en pestañas antiguas o también en cargas nuevas.

## Mitigación

**Para la persona afectada:** recargar la página (`Ctrl+F5` / `Cmd+Shift+R`).

**Si es masivo y persistente tras recargar:** el artefacto desplegado está incompleto → rollback.

## Rollback

Volver al despliegue anterior en Cloudflare Pages. Restaura los chunks antiguos y desbloquea las pestañas abiertas.

## Prevención

Este error es **inherente** a cualquier SPA con bundles versionados por hash. Mitigaciones posibles (todas `CAMBIO DE PRODUCTO`):

| Opción | Efecto | Coste |
|---|---|---|
| Frontera de error que detecte `ChunkLoadError` y recargue automáticamente | Resuelve el síntoma sin intervención | Bajo |
| Aviso «hay una versión nueva, recarga» | Da control a la persona | Medio |
| Conservar los artefactos de los N despliegues anteriores | Elimina el `404` | Depende de la plataforma |

La primera es la habitual: `error.tsx` ya existe en los cuatro árboles de la aplicación, y detectar `ChunkLoadError` para forzar `window.location.reload()` sería una adición pequeña.

Registrado como propuesta, no implementada.

## Escalado

No requiere escalado salvo que persista tras recargar, en cuyo caso se trata como despliegue defectuoso.

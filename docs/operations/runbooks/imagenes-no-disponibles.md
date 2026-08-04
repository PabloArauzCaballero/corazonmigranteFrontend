# Runbook — Imágenes no disponibles

## Síntoma

Imágenes que muestran el respaldo genérico, o huecos con el shimmer de carga permanente.

## Impacto

Cosmético en la mayoría de casos. En `/` afecta a la primera impresión del producto y al LCP.

## Cómo se comporta `SmartImage`

```
src inválido o vacío  → usa fallbackSrc directamente
src válido pero falla → onError → fallbackSrc (UNA sola vez, sin bucles)
fallbackSrc falla     → queda en estado "error"
```

El respaldo genérico es una imagen concreta de Cloudinary:
`https://res.cloudinary.com/sfyimi9x/image/upload/corazon-migrante/landing_page/media/carrusel-1.webp`

**Si ves esa imagen del carrusel donde debería haber otra cosa, es el fallback actuando.** Es la señal de diagnóstico más útil.

## Diagnóstico seguro

```bash
# ¿Responde la URL configurada?
curl -s -o /dev/null -w "%{http_code}\n" "URL_DE_LA_IMAGEN"

# ¿Qué valor quedó incrustado en el bundle?
grep -ro "res.cloudinary.com[^\"']*" out/_next/static/chunks/ | head -5
```

En el navegador → Network, filtrar por imágenes y buscar `404`, `403` o bloqueos de CSP.

## Causas por orden de probabilidad

| # | Causa | Indicio |
|---:|---|---|
| 1 | Variable `NEXT_PUBLIC_FILE_SERVER_*` vacía o mal escrita | `isValidSrc()` la rechaza → fallback inmediato |
| 2 | Recurso eliminado o renombrado en Cloudinary | `404` |
| 3 | Variable cambiada sin reconstruir | El bundle conserva el valor antiguo |
| 4 | URL con protocolo incorrecto o relativa mal formada | `isValidSrc()` la rechaza |
| 5 | CSP bloqueando `img-src` | Poco probable: `img-src` admite `https:` |
| 6 | Cloudinary caído | Todas las imágenes fallan a la vez |

**La causa 1 es la más frecuente**, y `isValidSrc()` la absorbe silenciosamente: rechaza `null`, `undefined`, `about:blank` y cadenas vacías, y pasa al fallback **sin ningún error en consola**. Es un diseño robusto que, precisamente por serlo, oculta el problema.

Existe un caso documentado por el equipo en el propio grafo: *«Guillermo Rivera — Médico Psiquiatra ❌ (sale vacío)»* y *«Daniel Limpias — Psicólogo ❌ (sale vacío)»*, que motivó las variables `NEXT_PUBLIC_FILE_SERVER_DOCTOR_*`. Ver [../../CLOUDINARY-ASSETS.md](../../CLOUDINARY-ASSETS.md).

## Evidencia a recoger

- URL exacta que falla y su código de estado.
- Valor de la variable correspondiente en el entorno.
- Si es una imagen concreta o todas.

## Mitigación

1. Verificar la URL con `curl`.
2. Corregir la variable en el entorno.
3. **Reconstruir y desplegar** — las `NEXT_PUBLIC_*` se incrustan en build.
4. Ejecutar `node scripts/audit-media-assets.mjs` para revisar el conjunto.

## Rollback

Solo si el incidente coincidió con un despliegue que cambió variables de imagen.

## Prevención

1. `scripts/audit-media-assets.mjs` ya existe: incorporarlo a la verificación previa al despliegue.
2. Mantener [.env.example](../../../.env.example) al día con todas las `NEXT_PUBLIC_FILE_SERVER_*`.
3. Considerar registrar en telemetría cuándo actúa el fallback: hoy es completamente invisible. Sería `CAMBIO DE PRODUCTO` pequeño y de alto valor diagnóstico.

## Escalado

Quien gestione la cuenta de Cloudinary. Sin definir en el repositorio (`OPS-05`).

# Runbook — Faltan cabeceras de seguridad en producción

## Síntoma

```bash
curl -sI https://DOMINIO/ | grep -i content-security-policy
# (sin salida)
```

**La aplicación funciona con total normalidad.** Ese es el problema: es un fallo invisible.

## Impacto

Se pierden simultáneamente:

- Protección anti-clickjacking (`X-Frame-Options`, `frame-ancestors`).
- Content Security Policy.
- HSTS.
- `noindex` a nivel de respuesta en los portales privados.
- `Cache-Control: no-store` en páginas con datos personales.
- Caché inmutable de `/_next/static/*` (degradación de rendimiento).

La pérdida de `no-store` es la más seria: páginas con datos de pacientes pasan a ser cacheables por proxies compartidos.

## Causa

`public/_headers` no llegó a `out/`. Cloudflare Pages lee ese archivo desde la raíz del artefacto publicado; si no está, no aplica ninguna regla.

Causas posibles:
- El archivo se movió o renombró fuera de `public/`.
- El directorio de salida configurado en Cloudflare Pages no es `out`.
- El artefacto desplegado se generó con un `public/` incompleto.

## Diagnóstico seguro

```bash
# 1. ¿Existe en el repositorio?
ls -la public/_headers

# 2. ¿Llegó al artefacto tras construir?
yarn build && ls -la out/_headers

# 3. ¿Las sirve producción?
curl -sI https://DOMINIO/          | grep -iE 'content-security|strict-transport|x-frame|x-content|referrer|permissions'
curl -sI https://DOMINIO/admin/    | grep -iE 'x-robots|cache-control'
curl -sI https://DOMINIO/_next/static/chunks/ | grep -i cache-control
```

Si el paso 2 funciona y el 3 no, el problema está en la configuración de Cloudflare Pages (directorio de salida), no en el build.

## Evidencia a recoger

- Salida completa de `curl -sI` sobre `/`, `/admin/` y un recurso estático.
- Presencia de `public/_headers` y `out/_headers`.
- Directorio de salida configurado en Cloudflare Pages.

## Mitigación

1. Confirmar que `public/_headers` existe en la rama desplegada.
2. Confirmar que el directorio de salida en Cloudflare Pages es **`out`**.
3. Reconstruir y volver a desplegar.
4. Verificar con el paso 3 del diagnóstico.

## Rollback

Volver a un despliegue anterior que sí sirviera las cabeceras.

## Prevención

Este fallo **no lo detecta nada hoy** — ni el build, ni las pruebas, ni el pipeline. Brecha `OPS-03`.

Propuestas (`INSTRUMENTACIÓN SEGURA`, no implementadas):

| # | Control | Momento |
|---:|---|---|
| 1 | Verificar `out/_headers` tras el build | En el pipeline, antes de publicar |
| 2 | Smoke con `curl -I` sobre el dominio publicado | Tras el despliegue |
| 3 | Comprobación periódica de cabeceras | Externa |

La número 1 es una línea de script y detectaría la causa más probable:

```bash
test -f out/_headers || { echo "ERROR: falta out/_headers"; exit 1; }
```

## Escalado

Quien gestione Cloudflare Pages. Sin definir en el repositorio (`OPS-05`).

Si se confirma que las cabeceras estuvieron ausentes en producción con tráfico real, tratarlo además como incidente de seguridad P2 y seguir [../../security/incident-response.md](../../security/incident-response.md).

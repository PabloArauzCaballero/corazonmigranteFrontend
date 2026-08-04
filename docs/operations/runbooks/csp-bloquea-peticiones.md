# Runbook — La CSP bloquea peticiones en producción

## Síntoma

Funciona en local y falla en producción. En la consola del navegador:

```
Refused to connect to 'https://host-nuevo.example/...' because it violates
the following Content Security Policy directive: "connect-src 'self' https:"
```

O variantes con `script-src`, `img-src`, `font-src`.

## Impacto

La funcionalidad afectada no opera. Si es la API, **la aplicación queda sin datos**.

## Por qué solo ocurre en producción

`next dev` **no aplica** `public/_headers`. Cloudflare Pages sí. Es la asimetría descrita en [../environments.md §2](../environments.md).

## Diagnóstico seguro

```bash
# Ver la CSP vigente
curl -sI https://DOMINIO/ | grep -i content-security-policy
```

En el navegador: DevTools → Console (mensaje `Refused to…`) y Network (petición marcada como bloqueada, `(blocked:csp)`).

Contrastar el host bloqueado con la directiva correspondiente en [public/_headers](../../../public/_headers).

## Evidencia a recoger

- Mensaje completo de consola, con la directiva citada.
- Host y esquema de la petición bloqueada.
- Valor actual de la cabecera.
- Qué cambio introdujo esa petición.

## Casos frecuentes

| Petición | Directiva | ¿Bloqueada con la CSP actual? |
|---|---|---|
| `http://` (sin TLS) hacia cualquier host | `connect-src 'self' https:` | ✅ **Sí** — solo se admite `https:` |
| `ws://` o `wss://` | `connect-src` | ✅ **Sí** — no se contempla WebSocket |
| `https://` hacia un host nuevo | `connect-src 'self' https:` | ❌ No — hoy `https:` los admite todos |
| Script desde un CDN externo | `script-src 'self' …` | ✅ **Sí** |
| Imagen `https://` | `img-src … https:` | ❌ No |
| Fuente desde otro origen | `font-src 'self' fonts.gstatic.com data:` | ✅ **Sí** |

**Los dos casos más probables hoy** son un endpoint en `http://` y un intento de WebSocket. El proyecto usa SSE precisamente porque viaja sobre HTTPS y entra en `https:`.

## Mitigación

**Corto plazo (incidente en curso):** rollback al despliegue anterior si el bloqueo rompe una funcionalidad crítica.

**Corrección:** editar `public/_headers` añadiendo el origen a la directiva correspondiente, y **reconstruir y desplegar** — `_headers` se copia a `out/` durante el build.

⚠️ Ampliar la CSP es una decisión de seguridad, no un ajuste de configuración. Toda ampliación debe justificarse y quedar reflejada en [../../security/content-security-policy.md](../../security/content-security-policy.md).

## Rollback

Revertir el cambio en `public/_headers`, reconstruir y desplegar. O volver al despliegue anterior en Cloudflare Pages.

## Prevención

1. Toda integración nueva que abra un canal de red debe revisarse contra `connect-src` **antes** de desplegar.
2. Preferir siempre `https:` sobre `http:`.
3. Si se cierra `connect-src` a la lista explícita de orígenes (el `PENDIENTE_CM_CSP_CONNECT_SRC` documentado en `_headers`), **este runbook pasará a ser mucho más frecuente**: cualquier host nuevo requerirá añadirlo. Es el precio, buscado, de una CSP estricta.
4. Un entorno de staging con las mismas cabeceras detectaría estos fallos antes de producción (`OPS-04`).

## Escalado

Sin definir en el repositorio. Ver [../../security/incident-response.md §6](../../security/incident-response.md).

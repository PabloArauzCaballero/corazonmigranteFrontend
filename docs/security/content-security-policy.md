# Content Security Policy y cabeceras

- **Fecha de evidencia:** 2026-08-03
- **Evidencia:** [public/_headers](../../public/_headers)

---

## 1. Dónde vive la configuración

Con `output: "export"` **no se puede usar `headers()` de `next.config.ts`**: no hay servidor Next.js que emita cabeceras. Cloudflare Pages lee `_headers` desde la raíz del artefacto publicado (`out/`).

El archivo se coloca en `public/`, de modo que el build lo copia a `out/`. Se verificó que `out/_headers` existe tras `yarn build`.

**Consecuencia importante:** `next dev` **no aplica ninguna de estas cabeceras**. Cualquier prueba de seguridad en local no refleja la configuración real. Ver [operations/environments.md](../operations/environments.md).

---

## 2. La CSP actual

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: blob: https:;
connect-src 'self' https:;
frame-ancestors 'none';
object-src 'none';
base-uri 'self';
form-action 'self'
```

| Directiva | Valoración | Justificación |
|---|---|---|
| `default-src 'self'` | 🟢 Correcta | Base restrictiva |
| `script-src 'self' 'unsafe-inline' 'unsafe-eval'` | 🟡 Permisiva | Necesarios para el runtime de Next.js. Mitigado por la ausencia total de scripts de terceros |
| `style-src 'self' 'unsafe-inline' fonts.googleapis.com` | 🟡 Aceptable | Tailwind y React inyectan estilos en línea. El riesgo de CSS es exfiltración por selectores, mucho menor que el de script |
| `font-src 'self' fonts.gstatic.com data:` | 🟢 Correcta | — |
| `img-src 'self' data: blob: https:` | 🟡 Amplia | `https:` permite cualquier host. Necesario porque las URLs de Cloudinary llegan por entorno. Riesgo bajo: una imagen no ejecuta código |
| `connect-src 'self' https:` | 🟡 **La más relevante** | Ver §3 |
| `frame-ancestors 'none'` | 🟢 Correcta | Anti-clickjacking; refuerza `X-Frame-Options` |
| `object-src 'none'` | 🟢 Correcta | Sin plugins |
| `base-uri 'self'` | 🟢 Correcta | Impide reescribir la base de URLs relativas |
| `form-action 'self'` | 🟢 Correcta | Impide enviar formularios a un origen externo |

---

## 3. `connect-src` — el estado real y por qué

El propio archivo documenta la evolución con precisión inusual: **era `*`** y se cerró a `'self' https:`. Eso eliminó dos vectores reales:

- **`http:` en claro** — exfiltración sin TLS desde una extensión o un script inyectado.
- **`ws:`/`wss:` hacia cualquier host** — el proyecto no usa WebSockets; el tiempo real es SSE, que viaja por HTTPS y ya entra en `https:`.

La telemetría **no exige abrir nada**: el exportador OTLP escribe en `/otel/v1/traces`, mismo origen, cubierto por `'self'`.

### Por qué no está cerrada del todo

El propio archivo lo declara como `PENDIENTE_CM_CSP_CONNECT_SRC`:

> *«el cierre definitivo es sustituir `https:` por la lista explícita de orígenes. No se puede hacer desde el repositorio porque el dominio real del backend vive en `NEXT_PUBLIC_API_BASE_URL` (fuera del control de versiones) y escribir uno inventado dejaría la aplicación sin API.»*

Valor objetivo, con el dominio a mano:

```
connect-src 'self' https://api.EL-DOMINIO-REAL https://res.cloudinary.com;
```

**Es una limitación real y correctamente razonada, no una omisión.** El riesgo residual es que un script ya inyectado podría exfiltrar hacia cualquier host HTTPS — pero para inyectar ese script haría falta antes vulnerar `script-src 'self'`.

Registrado como `SEC-04`, severidad MEDIUM. Cerrarlo es `CAMBIO DE PRODUCTO`.

---

## 4. Otras cabeceras en `/*`

| Cabecera | Valor | Protege de |
|---|---|---|
| `X-Frame-Options` | `DENY` | Clickjacking sobre el panel |
| `X-Content-Type-Options` | `nosniff` | Ejecución de un recurso por tipo adivinado |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Fuga de rutas internas hacia dominios externos |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` | Acceso a APIs que la aplicación no usa; `interest-cohort` desactiva FLoC |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Degradación a HTTP durante un año |

`Permissions-Policy` deniega explícitamente las tres capacidades sensibles **aunque la aplicación no las use**: si algún día una dependencia intentara usarlas, el navegador lo impediría.

---

## 5. Cabeceras por ruta

```
/admin/*      X-Robots-Tag: noindex, nofollow   ·   Cache-Control: no-store
/paciente/*   idem
/terapeuta/*  idem
/_next/static/*   Cache-Control: public, max-age=31536000, immutable
```

`no-store` en los portales privados evita que un proxy compartido o el disco del navegador conserve páginas con datos personales. `noindex` a nivel de respuesta refuerza el `robots: { index: false }` de los metadatos: la etiqueta `<meta>` solo se ve si el buscador ejecuta el HTML; la cabecera actúa siempre.

La caché inmutable de `/_next/static/*` es segura porque los bundles llevan hash en el nombre.

---

## 6. Verificación

```bash
# En producción
curl -sI https://EL-DOMINIO/ | grep -iE 'content-security|strict-transport|x-frame|x-content|referrer|permissions'
curl -sI https://EL-DOMINIO/admin/ | grep -iE 'x-robots|cache-control'

# Tras el build, confirmar que el archivo llegó al artefacto
ls -la out/_headers
```

**No existe validación automatizada de cabeceras en CI.** Registrado como `OPS-03`. Ver [operations/deployment.md](../operations/deployment.md).

---

## 7. Regla de mantenimiento

Cualquier integración nueva que abra un canal de red **debe** revisarse contra `connect-src`. Un endpoint que no encaje fallará silenciosamente en producción y funcionará en local, porque `next dev` no aplica la CSP. Es el modo de fallo más difícil de diagnosticar de todo el proyecto — de ahí el runbook [operations/runbooks/csp-bloquea-peticiones.md](../operations/runbooks/csp-bloquea-peticiones.md).

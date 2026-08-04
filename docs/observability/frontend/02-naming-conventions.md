# 02 — Convenciones de trazabilidad (Fase 2)

Documento **normativo**. Lo que aquí se prohíbe está además impedido por código
(`src/observability/core/sanitize.ts`) y verificado por tests
(`tests/unit/observability/*.test.ts`).

---

## 1. Nombres de servicio

| Servicio | Valor | Estado |
| --- | --- | --- |
| Navegador | `corazon-migrante-web` | **En uso** |
| Servidor Next.js | `corazon-migrante-next-server` | **Reservado, no existe** (`output: "export"`) |
| Runtime Edge | `corazon-migrante-edge` | **Reservado, no existe** |
| Gateway de telemetría | `corazon-migrante-otel-gateway` | Lo emite el Collector, no el frontend |

`service.namespace = corazon-migrante` en todos ellos.

Regla: **jamás** el mismo `service.name` para navegador y servidor. Si algún día
se activa un servidor Next, usará el nombre reservado.

---

## 2. Spans técnicos

Nombres fijos, sin interpolación:

| Nombre | Emisor |
| --- | --- |
| `documentLoad` | `DocumentLoadInstrumentation` (nombre propio de la instrumentación) |
| `route.navigation` | `useRouteTracing()` |
| `HTTP GET` / `HTTP POST` … | `FetchInstrumentation` (nombre propio) |
| `http.client` | span envolvente creado en `apiRequest()` |
| `ui.interaction` | spans manuales de interacción |
| `sse.connect` / `sse.message` | `use-admin-notifications` |

Los nombres que genera automáticamente una instrumentación oficial **no se
renombran**: cambiarlos rompe las convenciones semánticas que Jaeger y el
Collector esperan.

---

## 3. Spans de negocio

Formato obligatorio: **`<dominio>.<acción>`**, minúsculas, puntos como
separador, **sin identificadores**.

### Catálogo cerrado

```text
auth.login
auth.logout
auth.session.expired
patient.register
appointment.request
appointment.status.update
document.upload
document.download
```

Son ocho a propósito. **No se declara ningún nombre que no se emita**: una constante
sin uso hace creer que existe una traza que nadie encontrará en Jaeger.

Añadir un nombre nuevo obliga a (1) instrumentar la operación, (2) declarar la
constante y (3) añadir una sección en
[`03-business-spans-catalog.md`](./03-business-spans-catalog.md). El test
`tests/unit/observability/business-spans.test.ts` comprueba que los tres sitios no
divergen, en ambas direcciones.

### Prohibido

```text
✗ appointment.request.a3f21e88-...        (id en el nombre)
✗ document.upload.informe-medico-ana.pdf  (nombre de archivo)
✗ route./admin/usuarios/2837              (ruta con id)
✗ button.click.guardar-paciente-ana       (dato personal)
✗ `${feature}.${action}`                  (nombre dinámico)
```

---

## 4. Atributos propios

Namespace `app.*` para negocio, `ui.*` para interfaz, `network.*` para red.

### Permitidos

| Atributo | Tipo | Cardinalidad | Ejemplo |
| --- | --- | --- | --- |
| `app.feature` | string | ~20 | `appointments` |
| `app.operation` | string | ~10 | `create` |
| `app.route.template` | string | ≤ 56 | `/admin/usuarios` |
| `app.route.from` | string | ≤ 56 | `/admin` |
| `app.route.to` | string | ≤ 56 | `/admin/usuarios` |
| `app.release` | string | 1 por despliegue | `1.0.0+a1b2c3d` |
| `app.build.id` | string | 1 por despliegue | `a1b2c3d…` |
| `app.environment` | string | 4 | `production` |
| `app.authenticated` | boolean | 2 | `true` |
| `app.user.segment` | string | **4** | `patient` |
| `app.session.id` | string | alta, pero efímera y anónima | UUID v4 |
| `app.support.trace_ref` | string | alta | eco de `x-trace-id` del backend |
| `ui.component` | string | ~40 | `LoginForm` |
| `ui.action` | string | ~8 | `submit` |
| `ui.result` | string | **3** | `success` \| `error` \| `cancelled` |
| `ui.form.name` | string | ~15 | `login` |
| `ui.navigation.type` | string | **3** | `spa` \| `reload` \| `back-forward` |
| `network.request.type` | string | 3 | `api` \| `asset` \| `third-party` |
| `validation.success` | boolean | 2 | `false` |
| `validation.error.count` | int | acotada | `3` |
| `auth.method` | string | 1 | `password` |
| `auth.result` | string | 2 | `success` \| `failure` |
| `auth.failure.category` | string | **7** | ver §6 |
| `file.type` | string | ~8 | `image` |
| `file.extension` | string | ~12 | `pdf` |
| `file.size.bucket` | string | **5** | `1-5MB` |
| `upload.strategy` | string | 2 | `cloudinary-direct` \| `backend-multipart` |
| `error.type` | string | ~20 | `ApiError` |
| `error.source` | string | **5** | ver §7 |
| `error.handled` | boolean | 2 | `true` |
| `http.response.status_code` | int | acotada | `500` |
| `cache.result` | string | 2 | `hit` \| `miss` |
| `retry.count` | int | acotada | `1` |
| `web_vital.name` / `.value` / `.rating` | string/number/string | acotada | `LCP` / `2410` / `good` |

### Prohibidos — la lista es exhaustiva y el sanitizador la aplica

```text
✗ user.id, user.email, user.name, user.phone, user.document
✗ http.url completa (con query string)
✗ http.request.body, http.response.body
✗ http.request.header.authorization, cookie, set-cookie
✗ form.values, form.fields, cualquier valor de input
✗ file.name, file.path, file.content
✗ cloudinary.signature, cloudinary.upload_url, cualquier URL firmada
✗ session.token, jwt, refresh_token, access_token
✗ diagnóstico, síntoma, objetivo terapéutico, nota clínica
✗ importe, cuenta bancaria, tarjeta
✗ element.outerHTML, element.textContent, selector CSS largo
✗ redux/zustand state, props de React
```

---

## 5. Reglas de valores

1. **`app.route.template`** siempre es la plantilla, nunca la URL vivida.
2. **Nunca** se guarda la URL con query string ni fragmento. `sanitizeUrl()`
   corta en el primer `?` o `#`.
3. **Nunca** se guarda texto libre escrito por una persona.
4. Los enteros de conteo se acotan (`Math.min(n, 99)`) para no crear cardinalidad
   por accidente.
5. Todo string se trunca a **256** caracteres.
6. Un valor que case con correo, JWT (`eyJ…`), teléfono internacional o secuencia
   de 13-19 dígitos se sustituye entero por `[redacted]`.

---

## 6. Categorías normalizadas de fallo de autenticación

`auth.failure.category` ∈

```text
invalid_credentials
expired_session
network_error
server_error
validation_error
rate_limited
unknown
```

**Regla antienumeración:** un correo inexistente y una contraseña incorrecta
producen **exactamente** `invalid_credentials`. La telemetría nunca debe permitir
distinguir si una cuenta existe.

---

## 7. Categorías de origen de error

`error.source` ∈

```text
window            ← window.onerror
promise           ← unhandledrejection
react             ← Error Boundary / error.tsx
http              ← apiRequest
chunk             ← fallo de carga diferida
```

---

## 8. Segmentos de usuario

`app.user.segment` ∈ `anonymous` · `patient` · `professional` · `staff`

Mapeo desde el rol real:

| Rol | Segmento |
| --- | --- |
| (sin sesión) | `anonymous` |
| `PACIENTE` | `patient` |
| `TERAPEUTA` | `professional` |
| `ADMIN`, `SUPER_ADMIN`, `CONTADOR` | `staff` |

Se agrupan a propósito: el equipo administrativo es pequeño y `CONTADOR` sería
casi un identificador personal.

---

## 9. Buckets de tamaño de archivo

`file.size.bucket` ∈

```text
0-1MB
1-5MB
5-20MB
20-100MB
100MB+
```

Nunca el tamaño exacto: combinado con la hora, un tamaño en bytes puede
identificar un documento concreto.

---

## 10. Nombres de operación HTTP

El span envolvente de `apiRequest()` se llama `http.client` y lleva:

```text
http.request.method   = POST
app.route.template    = /api/v1/appointments/:id/status
server.address        = api.corazonmigrante.example
```

La plantilla se obtiene de `ENDPOINTS` (donde ya viven con `:param`), **no** de
la URL final. Ejemplos correctos:

```text
GET  /api/v1/admin/users
POST /api/v1/auth/login
PATCH /api/v1/appointments/:appointmentId/status
```

Incorrectos:

```text
✗ GET /api/v1/admin/users?search=ana%20maria
✗ PATCH /api/v1/appointments/9f1c-.../status
```

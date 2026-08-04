# Catálogo de eventos de telemetría

- **Fecha de evidencia:** 2026-08-03

> **Documento derivado.** La referencia normativa del equipo es [frontend/02-naming-conventions.md](frontend/02-naming-conventions.md) (nombres y atributos permitidos) y [frontend/03-business-spans-catalog.md](frontend/03-business-spans-catalog.md), que cataloga **los ocho spans de negocio** uno a uno. Esta página resume los que se verificaron directamente en el código durante la auditoría documental; **ante cualquier discrepancia, prevalecen los documentos 02 y 03**.

> ⚠️ **La telemetría está apagada por defecto** (`NEXT_PUBLIC_OTEL_ENABLED=false`), también en producción. Nada de lo que sigue se está emitiendo hoy.

> No hay analítica de producto de terceros. Lo que sigue son **spans de OpenTelemetry**, no eventos de una plataforma comercial. Ver [../integrations/analytics.md](../integrations/analytics.md).

---

## 1. Spans de negocio

Definidos en `BUSINESS_SPANS` ([tracing.constants.ts](../../src/observability/core/tracing.constants.ts)). **Son ocho**; a continuación se detallan los dos verificados en profundidad durante esta auditoría. El catálogo completo está en [frontend/03-business-spans-catalog.md](frontend/03-business-spans-catalog.md).

### `auth.session_expired`

| Campo | Valor |
|---|---|
| **Propósito** | Distinguir «la sesión murió y se expulsó a la persona» de un `401` cualquiera |
| **Disparador** | `handleUnauthorizedSession()` en `client.ts`, ante un `401` en petición autenticada |
| **Atributos** | `feature: "auth"`, `operation: "session-expired"` |
| **Prohibido** | Identidad, correo, token, URL |
| **Consumidor** | Panel P3 — un pico es la señal más temprana del bucle de login |
| **Prueba** | ❌ |

El comentario del código lo justifica: *«es de las cosas que más se investigan cuando alguien reporta que "se sale solo"»*.

### `auth.logout`

| Campo | Valor |
|---|---|
| **Propósito** | Cierre de sesión voluntario |
| **Disparador** | `logout()` en `use-session.tsx` |
| **Atributos** | `feature: "auth"`, `operation: "logout"` |
| **Efecto colateral** | Rota el id de sesión de telemetría |
| **Prueba** | ❌ |

---

## 2. Spans técnicos

Definidos en `TECHNICAL_SPANS`.

### `http.client`

| Campo | Valor |
|---|---|
| **Propósito** | Padre de negocio de cada petición: la llamada **tal como la ve la aplicación**, incluido el reintento |
| **Disparador** | Toda invocación de `apiRequest()` |
| **Atributos** | `http.request.method`, `route_template`, `network.request_type: "api"`, `http.response.status_code`, `retry_count` |
| **Prohibido** | URL completa, query string, cuerpo, cabeceras |
| **Prueba** | ✅ Indirecta vía `api-client.test.ts` |

El span de red lo crea `FetchInstrumentation` como **hijo**: no hay duplicación. Uno mide la llamada de negocio, el otro el viaje HTTP.

**`retry_count` es el atributo más valioso del catálogo**: expone que una petición tardó el doble por el reintento de compatibilidad con la validación estricta del backend. Sin él, ese coste es invisible.

### `sse.connect`

| Campo | Valor |
|---|---|
| **Propósito** | Apertura del stream de notificaciones |
| **Atributos** | `feature: "notifications"`, `operation: "stream-open"`, `ui.result: success \| error` |
| **Prohibido** | **La URL — contiene el JWT** |
| **Prueba** | ❌ |

El comentario del código es explícito:

> *«⚠️ `url` lleva el JWT en la query string. NUNCA puede entrar en un atributo de span. Por eso el span de conexión no registra ninguna URL: solo el hecho de que se abrió el stream.»*

### `sse.message`

| Campo | Valor |
|---|---|
| **Propósito** | Llegada de una notificación |
| **Atributos** | `feature: "notifications"`, `operation: "stream-message"`, `network.request_type: "api"` |
| **Prohibido** | **El `payload`** — puede contener el nombre de un paciente |
| **Prueba** | ❌ |

Ni siquiera se registra `event.type`, aunque sea un conjunto cerrado de seis valores sin riesgo de cardinalidad.

---

## 3. Instrumentación automática

| Fuente | Qué produce |
|---|---|
| `instrumentation-document-load` | Carga inicial del documento |
| `instrumentation-fetch` | Spans de red, hijos de `http.client` |
| `use-route-tracing.ts` | Navegación SPA, con la ruta como **plantilla** |
| `use-web-vitals.ts` | LCP, INP, CLS, FCP, TTFB |

---

## 4. Atributos comunes

`commonAttributes()` en `tracing.service.ts` añade a todos los spans:

| Atributo | Origen | Nota |
|---|---|---|
| Id de sesión de telemetría | `telemetrySessionId()` | Aleatorio, **sin relación con `userId`**, rotado al cerrar sesión |
| Segmento de usuario | `userSegmentFromRole()` | Categoría del rol, no el rol exacto |
| Entorno | `defaultEnvironment()` | — |
| Build id | `shortBuildId()` | Permite correlacionar con un despliegue |

---

## 5. La regla que gobierna el catálogo

`safeAttributes()` aplica **`ALLOWED_ATTRIBUTE_KEYS`: una lista blanca.**

> Un atributo nuevo **no sale** hasta que alguien lo añade explícitamente a la lista.

Con lista negra, cada atributo sería sensible por defecto hasta que alguien recordara prohibirlo. Con lista blanca, es inerte hasta que alguien lo autoriza. Para una aplicación que trata datos de salud, es la única opción defendible.

Segunda capa: `SanitizingSpanProcessor` revisa cada span **antes de exportarlo**.

---

## 6. Al añadir un evento

1. Declararlo en `BUSINESS_SPANS` o `TECHNICAL_SPANS`.
2. Añadir sus atributos a `ALLOWED_ATTRIBUTE_KEYS`.
3. **Revisar la privacidad**: ¿puede ese valor identificar a alguien o revelar un dato clínico?
4. Comprobar la cardinalidad: nada de identificadores como valor de atributo.
5. Documentarlo en esta página con propósito, disparador, atributos y prohibiciones.
6. Añadir prueba en `tests/unit/observability/` si introduce lógica de saneado.

> **No añadir telemetría nueva como parte implícita de otro cambio.**

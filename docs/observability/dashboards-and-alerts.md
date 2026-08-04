# Paneles y alertas

- **Fecha de evidencia:** 2026-08-03

## 1. Estado

> **No existe ningún panel ni ninguna alerta documentada en el repositorio.**

Los datos se recogen, se sanean, se exportan y llegan al colector. Ahí termina la cadena documentada. Es la brecha `PERF-02`.

La configuración de referencia del colector está en [infra/otel-collector/](../../infra/otel-collector/), pero la definición de paneles y alertas no forma parte de este repositorio.

## 2. Lo importante: el dato ya existe

Construir lo que sigue **no requiere tocar el frontend**. Toda la instrumentación está hecha y emitiendo.

## 3. Paneles propuestos

### P1 — Salud de la API

| Métrica | Fuente | Utilidad |
|---|---|---|
| Tasa de error por plantilla de ruta | `http.client` + `http.response.status_code` | Detectar un endpoint roto |
| Latencia p50/p95/p99 por endpoint | Duración del span `http.client` | Separar «la app va lenta» de «la API va lenta» |
| **Tasa de `retry_count > 0`** | Atributo `retry_count` | Coste oculto del reintento por validación |
| Volumen de `401` | Código de estado | Sesiones caducando |

La tercera fila mide algo que de otro modo es invisible: peticiones que tardan el doble por una incompatibilidad de validación con el backend.

### P2 — Core Web Vitals

LCP, INP y CLS **por plantilla de ruta**, en p75. Prioridad a `/`, que es la ruta más pesada (194 kB) y la más visitada.

### P3 — Sesión y autenticación

| Métrica | Fuente | Por qué importa |
|---|---|---|
| Frecuencia de `auth.session_expired` | Span de negocio | **Un pico es la señal más temprana del bucle de login** |
| Frecuencia de `auth.logout` | Span de negocio | Uso normal |

### P4 — Notificaciones en tiempo real

Aperturas de `sse.connect`, tasa de `ui.result = error`, volumen de `sse.message`. Detecta que el stream dejó de funcionar — hoy, si falla, **no se reintenta** y nadie se entera.

## 4. Alertas propuestas

| # | Condición | Severidad | Qué indica |
|---:|---|---|---|
| 1 | Tasa de error `5xx` > umbral durante 15 min | **P1** | Backend degradado |
| 2 | Pico de `auth.session_expired` sobre la línea base | **P1** | Posible bucle de login |
| 3 | LCP p75 > 2,5 s durante 24 h | P2 | Degradación de rendimiento |
| 4 | Caída a cero de spans `http.client` | **P1** | La aplicación no llega al backend, o dejó de cargar |
| 5 | Tasa de `retry_count > 0` creciente | P3 | Deriva contractual con el backend |
| 6 | `sse.connect` con `ui.result = error` sostenido | P3 | Stream de notificaciones caído |

La alerta 4 es la de mayor valor y la más fácil de olvidar: **la ausencia de telemetría es en sí misma una señal**. Un panel que solo vigila umbrales altos no detecta que la aplicación dejó de cargar.

La alerta 2 detectaría el incidente descrito en [../operations/runbooks/autenticacion-en-bucle.md](../operations/runbooks/autenticacion-en-bucle.md) antes de que llegue el primer reporte.

## 5. Lo que ningún panel podrá responder

Por diseño de privacidad:

- Quién sufrió el error.
- Qué datos concretos se estaban viendo.
- Qué URL exacta se visitó.

Ver [../security/privacy.md](../security/privacy.md) y [error-reporting.md §4](error-reporting.md).

## 6. Prioridad

Si solo se pudiera hacer una cosa: **el panel P1 y la alerta 4**. Responden a «¿funciona la aplicación?» y «¿va lenta por el frontend o por la API?», que son las dos primeras preguntas de cualquier incidente.

Coste: cero cambios en el frontend.

# Monitorización de rendimiento

- **Fecha de evidencia:** 2026-08-03

## 1. Lo que existe

| Capacidad | Estado | Implementación |
|---|---|---|
| Recogida de Web Vitals | ✅ | [`use-web-vitals.ts`](../../src/observability/react/use-web-vitals.ts) |
| Trazas de navegación SPA | ✅ | [`use-route-tracing.ts`](../../src/observability/react/use-route-tracing.ts) |
| Trazas de carga de documento | ✅ | `@opentelemetry/instrumentation-document-load` |
| Trazas de `fetch` | ✅ | `@opentelemetry/instrumentation-fetch` |
| Span de negocio por petición | ✅ | `http.client` en `apiRequest()` |
| Muestreo | ✅ | [`browser-sampling.ts`](../../src/observability/browser/browser-sampling.ts) |
| Exportación | ✅ | OTLP HTTP a `/otel/v1/traces` |
| **Panel de métricas** | ❌ | **No existe en el repositorio** |
| **Alertas** | ❌ | No definidas |
| **Medición de laboratorio en CI** | ❌ | Sin Lighthouse CI |
| **RUM de campo** | ❌ | Sin panel público |

## 2. El diagnóstico honesto

> ⚠️ **La telemetría está apagada por defecto** (`NEXT_PUBLIC_OTEL_ENABLED=false`), **también en producción**. Encenderla exige la revisión descrita en [observability/frontend/05-data-privacy-policy.md](../observability/frontend/05-data-privacy-policy.md).

Es decir: hoy **no se está emitiendo nada** en producción. La instrumentación está construida, medida y probada; su activación es una decisión pendiente, no un olvido.

Con la bandera encendida, la cadena sería: navegador → Pages Function `/otel/v1/traces` → Collector → Jaeger. El destino de las trazas es **Jaeger**, y el propio equipo documenta en [04-web-vitals-strategy.md](../observability/frontend/04-web-vitals-strategy.md) por qué Jaeger **no** es la plataforma adecuada para métricas de Web Vitals.

Eso matiza `PERF-02`: no es «se recogen datos y nadie los mira», sino **«la plataforma de destino no es la adecuada para agregar métricas, y la telemetría está apagada mientras se decide»**. La parte cara —instrumentación, saneado, medición de coste— ya está hecha.

## 3. Qué se puede observar hoy

Con la instrumentación existente, un panel sobre el colector podría responder:

| Pregunta | Dato disponible |
|---|---|
| ¿Qué rutas tienen peor LCP? | Web Vitals + `route_template` |
| ¿Qué endpoints son más lentos? | Span `http.client` con método y plantilla |
| ¿Cuántas peticiones fallan y con qué código? | `http.response.status_code` |
| ¿Con qué frecuencia caducan las sesiones? | Span `auth.session_expired` |
| ¿Cuántas peticiones necesitan el reintento por validación? | `retry_count` en el span |
| ¿Se abre y sostiene el stream de notificaciones? | Spans `sse.connect` y `sse.message` |
| ¿Qué segmento de usuario sufre peor rendimiento? | `USER_SEGMENT` |

El atributo `retry_count` es especialmente valioso: expone un coste oculto —peticiones que tardan el doble por una incompatibilidad de validación con el backend— que de otro modo sería invisible.

## 4. Lo que deliberadamente NO se puede observar

Por diseño de privacidad ([../security/privacy.md](../security/privacy.md)):

- La identidad de la persona usuaria.
- URLs concretas con identificadores (solo plantillas).
- Cuerpos de petición o respuesta.
- El contenido de las notificaciones.

**Es un compromiso consciente:** protege a las personas usuarias en el día a día y reduce la capacidad forense durante un incidente. Ver [../security/incident-response.md §4](../security/incident-response.md).

## 5. Configuración de telemetría

[`telemetry.config.ts`](../../src/observability/config/telemetry.config.ts) resuelve la configuración con `telemetry.schema.ts` (zod):

- `DEFAULT_SAMPLE_RATIO` — proporción de muestreo.
- `defaultEnvironment()` / `shortBuildId()` — contexto de despliegue y versión.
- `disabledTelemetryConfig()` — **la telemetría se puede desactivar por completo**, y en ese caso el módulo es inerte.

Que la telemetría sea desactivable sin romper nada es una propiedad importante: permite descartarla como causa durante un incidente de rendimiento.

## 6. Propuesta priorizada

`INSTRUMENTACIÓN SEGURA` — ninguna implementada aquí.

| # | Acción | Toca el frontend | Valor |
|---:|---|---|---|
| 1 | Decidir la plataforma de métricas (Jaeger no lo es) y encender la bandera | ❌ No | **Alto — es el bloqueo real** |
| 2 | Panel con LCP/INP/CLS por plantilla de ruta | ❌ No | Alto |
| 3 | Panel de latencia y tasa de error por endpoint | ❌ No | Alto |
| 4 | Alerta si LCP p75 supera 2,5 s durante 24 h | ❌ No | Alto |
| 5 | Alerta si la tasa de error 5xx supera un umbral | ❌ No | Alto |
| 6 | Lighthouse CI sobre 4 rutas | ✅ Sí (pipeline) | Medio |
| ~~7~~ | ~~Medir el coste de bundle de OpenTelemetry~~ | — | ✅ **Hecho** — ver [bundle-analysis.md §5](bundle-analysis.md) |

**Ninguna de las cinco primeras requiere tocar el frontend.** Es la razón de que `PERF-02` se clasifique como MEDIUM y no como BLOCKER: no hay trabajo de producto pendiente, hay una decisión de operación pendiente.

Ver [../observability/dashboards-and-alerts.md](../observability/dashboards-and-alerts.md) y [../../infra/otel-collector/](../../infra/otel-collector/).

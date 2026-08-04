# Analítica

- **Fecha de evidencia:** 2026-08-03

## 1. No hay analítica de terceros

**Ninguna.** Sin Google Analytics, sin Segment, sin Mixpanel, sin píxeles de redes sociales, sin Hotjar.

Verificado: no hay etiquetas `<script>` hacia dominios externos, y la CSP mantiene `script-src 'self' 'unsafe-inline' 'unsafe-eval'` sin ningún host externo.

**Es una propiedad destacable, no una carencia:**

| Consecuencia | Efecto |
|---|---|
| Sin transferencia de datos a terceros | Simplifica enormemente la posición de privacidad |
| Sin cookies de terceros | No hay tratamiento con fines publicitarios |
| `script-src 'self'` sostenible | Elimina una familia entera de riesgos de cadena de suministro |
| Sin peso de scripts externos | Contribuye al presupuesto de rendimiento |

Para una aplicación que trata datos de salud de personas migrantes, la ausencia de analítica comercial es **coherente con el producto**, no un descuido.

## 2. Lo que sí se mide

Telemetría propia con OpenTelemetry, exportada al **mismo origen** (`/otel/v1/traces` vía Cloudflare Pages Function).

| Categoría | Qué se recoge |
|---|---|
| Navegación | Cambios de ruta como **plantilla** (`/admin/users/:id`) |
| Carga de documento | `instrumentation-document-load` |
| Peticiones | Span `http.client` con método, plantilla, código de estado, `retry_count` |
| Web Vitals | LCP, INP, CLS, FCP, TTFB |
| Spans de negocio | `auth.logout`, `auth.session_expired`, `sse.connect`, `sse.message` |
| Segmento | Categoría del rol (`USER_SEGMENT`), no el rol exacto |
| Contexto | Entorno y build id |

Detalle en [analytics-events.md](../observability/analytics-events.md) y [../observability/frontend/02-naming-conventions.md](../observability/frontend/02-naming-conventions.md).

## 3. Analítica del módulo de tutoriales

`src/features/tutorial/analytics/` define un adaptador propio con dos implementaciones observables en el grafo: `consoleAnalytics` y `silentAnalytics`, sobre los tipos `TutorialAnalyticsAdapter`, `TutorialAnalyticsEvent` y `TutorialAnalyticsEventName`.

Es un **puerto sin proveedor externo**: el módulo puede emitir eventos de progreso, y hoy no se envían a ninguna plataforma. Tiene prueba propia (`tutorial-analytics.test.ts`).

Diseño correcto: la abstracción existe por si algún día hace falta, sin acoplar el módulo a ningún proveedor.

## 4. Qué nunca se registra

Por diseño, con doble capa de saneado:

- Identidad de la persona usuaria.
- URLs concretas con identificadores.
- Cuerpos de petición o respuesta.
- Contenido de las notificaciones.
- El JWT — con mención explícita en el código del stream SSE.
- Nombres de campos de formulario rechazados por validación.

Ver [../security/privacy.md §3](../security/privacy.md).

## 5. Consentimiento

No hay banner ni gestión de consentimiento. El análisis de si hace falta está en [../security/privacy.md §6](../security/privacy.md): las claves de sesión son estrictamente necesarias, no hay cookies de terceros, y la telemetría es medición propia con datos saneados.

**Este portal no emite dictamen jurídico.** Aporta el inventario exacto de lo que se trata, que es el insumo de esa decisión. Brecha `PRIV-02`.

## 6. Regla

> **No añadir telemetría nueva como parte implícita de otro cambio.**

Todo evento nuevo requiere: justificación, entrada en `ALLOWED_ATTRIBUTE_KEYS`, revisión de privacidad y registro en [analytics-events.md](../observability/analytics-events.md).

Introducir el **primer** script de terceros obligaría a reevaluar la CSP, el modelo de amenazas y la posición de privacidad completa. No sería un cambio menor.

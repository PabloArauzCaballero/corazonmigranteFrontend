# 01 — Diseño de arquitectura de observabilidad (Fase 1)

Depende de: [`00-current-state-audit.md`](./00-current-state-audit.md).

---

## 1. Principio rector

El frontend habla **solo OpenTelemetry**. No conoce Jaeger, ni su formato, ni su
URL. Todo lo específico del proveedor vive en el Collector y en la
infraestructura.

```text
Componente React
      │  (solo @opentelemetry/api)
      ▼
TracingService  (src/observability/core/tracing.service.ts)
      │
      ▼
WebTracerProvider  ──►  BatchSpanProcessor  ──►  OTLPTraceExporter (HTTP/JSON)
                                                        │
                                                        ▼
                                         /otel/v1/traces   (mismo origen)
                                                        │
                                    Cloudflare Pages Function (prod)
                                    Next Route Handler      (dev)
                                                        │
                                                        ▼
                                            OpenTelemetry Collector
                                                        │
                                                        ▼
                                                     Jaeger
```

Cambiar Jaeger por Tempo, Zipkin o cualquier otro backend **no toca una sola
línea del frontend**: se cambia el `exporters:` del Collector.

---

## 2. Estrategia de renderizado: SPA estática, no híbrida

`output: "export"` convierte este proyecto en una **SPA prerenderizada**:

- El HTML de cada ruta se genera en build y se sirve como fichero estático.
- Toda la lógica ocurre en el navegador tras la hidratación.
- **No hay `atlas-next-server`.** El diagrama "Arquitectura Next.js" del prompt
  maestro se reduce a la rama del navegador.

Por tanto se define **un único servicio**: `corazon-migrante-web`.

Se reserva el nombre `corazon-migrante-next-server` en la documentación por si
algún día se elimina `output: "export"`, pero **no se crea `instrumentation.ts`
con `NodeSDK`**: sería código muerto que además arrastraría dependencias de Node
al repositorio sin ejecutarse nunca.

---

## 3. Instrumentación del cliente

### Punto de arranque

Next.js 15.3+ soporta **`instrumentation-client.ts`** en la raíz del proyecto: se
ejecuta en el navegador **antes de que se hidrate la aplicación**, que es
exactamente la ventana que necesitamos para que `DocumentLoadInstrumentation`
capture la carga inicial.

```text
instrumentation-client.ts     ← raíz del proyecto (lo carga Next automáticamente)
      │
      │  import("@/observability/browser/telemetry.browser")   ← DINÁMICO
      ▼
initBrowserTelemetry()
```

El `import()` es dinámico y **condicionado a la configuración**. Si
`NEXT_PUBLIC_OTEL_ENABLED` no es `true`, el chunk del SDK nunca se descarga y el
coste en el bundle es cero.

### Estructura de archivos

```text
instrumentation-client.ts                    ← arranque (Next lo detecta solo)

src/observability/
├── config/
│   ├── telemetry.types.ts                   ← tipos de la configuración
│   ├── telemetry.schema.ts                  ← validación zod
│   └── telemetry.config.ts                  ← adaptador: env → TelemetryConfig
├── core/
│   ├── tracing.constants.ts                 ← nombres de spans y atributos
│   ├── tracing.types.ts
│   ├── tracing.attributes.ts                ← sanitización + helpers
│   ├── tracing.service.ts                   ← runInSpan / startSpan / addEvent…
│   ├── route-template.ts                    ← URL → plantilla de ruta
│   ├── session-id.ts                        ← id efímero de sesión
│   └── sanitize.ts                          ← redacción de datos sensibles
├── browser/
│   ├── telemetry.browser.ts                 ← orquestador idempotente
│   ├── browser-resource.ts
│   ├── browser-exporter.ts
│   ├── browser-sampling.ts
│   ├── browser-instrumentations.ts
│   ├── browser-lifecycle.ts                 ← pagehide / visibilitychange
│   └── browser-errors.ts                    ← onerror / unhandledrejection
├── react/
│   ├── telemetry-boundary.tsx               ← Error Boundary de telemetría
│   ├── react-error-reporter.ts              ← usado por los error.tsx existentes
│   ├── use-route-tracing.ts                 ← spans de navegación SPA
│   ├── use-web-vitals.ts
│   └── telemetry-provider.tsx               ← componente sin UI para AppProviders
└── index.ts                                 ← superficie pública
```

Ningún archivo pasa de 300 líneas.

---

## 4. Endpoint OTLP y gateway

### Producción — Cloudflare Pages Function

`output: "export"` no deja usar Route Handlers en producción, pero Cloudflare
Pages **sí** despliega funciones desde el directorio `functions/` de la raíz,
junto al artefacto estático. Es el único mecanismo de mismo origen disponible.

```text
functions/otel/v1/traces.ts     →  https://<dominio>/otel/v1/traces
```

Controles implementados en la función:

| Control | Valor |
| --- | --- |
| Métodos | Solo `POST` (y `OPTIONS` para preflight de mismo origen) |
| `Content-Type` | Solo `application/json` |
| Tamaño máximo | 512 KB por lote (rechaza con `413`) |
| Origen | Solo el propio dominio (`same-origin`) |
| Timeout hacia el Collector | 5 s |
| Cuerpo en logs | **Nunca** se registra |
| Secreto | **Ninguno en el frontend**. La URL del Collector es una variable de entorno *del servidor* de Pages (`OTEL_COLLECTOR_URL`), invisible para el navegador |
| Si el Collector no responde | Devuelve `202` igualmente: el navegador no debe reintentar ni ver errores |

### Desarrollo — Route Handler de Next

`next dev` sí levanta un servidor. Se añade
`src/app/api/otel/traces/route.ts`, equivalente funcional de la Pages Function.
Se comporta igual que `/api/debug-log`: existe solo en desarrollo y no llega al
artefacto exportado.

En desarrollo la variable apunta a `/api/otel/traces`; en producción a
`/otel/v1/traces`. Ambas son **rutas relativas del mismo origen**, así que:

- no hay CORS para la telemetría,
- no hay preflight,
- `connect-src 'self'` basta en la CSP.

### Lo que está prohibido

- Apuntar el navegador a la UI de Jaeger (`:16686`).
- Apuntar el navegador directamente a `:4318` del Collector.
- Incrustar cualquier clave o token en `NEXT_PUBLIC_*`.

---

## 5. Propagación hacia el backend

El backend vive en **otro origen** (`NEXT_PUBLIC_API_BASE_URL`). Añadir
`traceparent` convierte peticiones simples en peticiones con preflight.

**Decisión:** la propagación se controla con una bandera **independiente** de la
telemetría y **apagada por defecto**:

```env
NEXT_PUBLIC_OTEL_PROPAGATE_BACKEND=false
```

- `false` → se recogen trazas del navegador, sin tocar las cabeceras salientes.
  Riesgo cero para la aplicación. Es el valor por defecto.
- `true` → se añade `traceparent` **solo** a URLs que casen con el origen del
  backend configurado. Requiere que el backend declare:

  ```text
  Access-Control-Allow-Headers: content-type, authorization, traceparent, tracestate
  ```

Propagadores: **`W3CTraceContextPropagator` únicamente**. No se usa `baggage`:
no existe hoy ningún atributo aprobado que merezca cruzar el límite de servicio,
y `baggage` es el vector más fácil para filtrar datos personales sin querer.

**Nunca** se propaga a Cloudinary, Google Fonts ni a ningún tercero. La lista
blanca se construye a partir de `NEXT_PUBLIC_API_BASE_URL`, no con comodines.

El frontend **no fabrica** `trace_id` a mano ni reutiliza un `x-trace-id` de
respuesta como contexto: si el backend lo devuelve, se guarda como *atributo* de
soporte (`app.support.trace_ref`), nunca como contexto W3C.

---

## 6. Sampling

| Entorno | Ratio en el navegador | Motivo |
| --- | --- | --- |
| `development` | 1.00 | Se quiere ver todo |
| `test` | 0.00 (o exportador en memoria) | Los tests no exportan |
| `staging` | 1.00 | Volumen bajo |
| `production` | **0.05** (valor inicial) | A ajustar con tráfico real |

Estrategia: `ParentBasedSampler` con `TraceIdRatioBasedSampler` como raíz. La
decisión de la raíz la toma el navegador; el backend la respeta.

**Decisión de sesión**: el ratio se aplica por *traza*, no por sesión. Se
documenta en la Fase 33 por qué no se implementó *session sampling*: requeriría
un identificador estable y persistente, que es justo lo que la política de
privacidad quiere evitar.

La retención selectiva de errores y latencia alta se hace con **tail sampling en
el Collector**, no en el navegador: el navegador no puede saber si una traza
terminará en error cuando decide muestrearla.

---

## 7. Atributos: permitidos y prohibidos

Definición normativa en [`02-naming-conventions.md`](./02-naming-conventions.md)
y [`05-data-privacy-policy.md`](./05-data-privacy-policy.md).

Resumen de la **regla de oro**: todo valor que entra en un atributo pasa por
`sanitizeAttributeValue()`. La función:

1. elimina cualquier query string y fragmento,
2. sustituye segmentos que parezcan identificadores (UUID, numéricos, slugs
   largos) por `:id`,
3. trunca a 256 caracteres,
4. rechaza el valor completo si detecta un patrón de correo, JWT, teléfono o
   número de tarjeta.

No existe ninguna ruta de código que escriba un atributo sin pasar por ahí.

---

## 8. Rutas dinámicas

Solo hay una: `/(public)/[slug]`. La plantilla se calcula sin acceder al router
interno de Next:

```text
/inicio          → /:slug
/biblioteca      → /:slug        (colisiona con la estática; se resuelve con lista blanca)
/admin/usuarios  → /admin/usuarios
/noticias/detalle?id=123 → /noticias/detalle
```

Se mantiene una **lista blanca de rutas estáticas conocidas** generada desde
`src/app`. Si el pathname está en la lista, se usa tal cual. Si no, se
normaliza segmento a segmento. Así `app.route.template` tiene cardinalidad
acotada por construcción (≤ 56 valores).

---

## 9. Usuarios y sesiones

- **Nunca** se envía `userId`, correo, nombre ni rol individual.
- `app.session.id`: UUID aleatorio guardado en **`sessionStorage`**, no en
  `localStorage`. Muere al cerrar la pestaña. No se deriva de ningún dato
  personal.
- `app.authenticated`: `true` / `false`.
- `app.user.segment`: categoría de baja cardinalidad derivada del rol
  (`anonymous`, `patient`, `professional`, `staff`). Los cinco roles reales
  (`PACIENTE`, `TERAPEUTA`, `ADMIN`, `SUPER_ADMIN`, `CONTADOR`) se agrupan a
  propósito para que el segmento no identifique a nadie en un equipo pequeño.

---

## 10. Errores

Tres fuentes, **una sola escritura** por error:

```text
window.onerror / unhandledrejection   ─┐
Error Boundary de React (error.tsx)   ─┼─► reportError()  ─► dedupe por huella ─► span
apiRequest() (fallo HTTP)             ─┘
```

`reportError()` mantiene un `Set` con las huellas de los últimos errores
(`tipo|mensaje-normalizado|ruta`) durante 10 s. El mismo error propagándose por
las tres vías genera **un** span.

El mensaje **no** se exporta crudo: se pasa por el sanitizador y se acompaña de
`error.type` (nombre de la clase) y una categoría normalizada.

---

## 11. Web Vitals

Jaeger es un almacén de trazas, no de métricas. Decisión (detallada en
[`04-web-vitals-strategy.md`](./04-web-vitals-strategy.md)):

- LCP, CLS, INP, FCP y TTFB se adjuntan como **eventos del span
  `document.load`** o del span `route.navigation` correspondiente, con el valor
  redondeado y una etiqueta `good`/`needs-improvement`/`poor`.
- **No** se crea un span por métrica ni por *layout shift*.
- Si en el futuro se quiere análisis agregado, se exportan como métricas OTLP
  desde el Collector hacia Prometheus. La ruta está documentada, no
  implementada.

Se usa la API `PerformanceObserver` nativa; **no** se añade la librería
`web-vitals` para no crecer el bundle.

---

## 12. Versionado y despliegue

| Atributo | Origen |
| --- | --- |
| `service.version` | `NEXT_PUBLIC_APP_VERSION` ← `package.json.version` en CI |
| `app.build.id` | `NEXT_PUBLIC_BUILD_ID` ← `CF_PAGES_COMMIT_SHA` (Cloudflare) o `GITHUB_SHA` |
| `app.release` | `${service.version}+${app.build.id.slice(0,7)}` |
| `deployment.environment.name` | `NEXT_PUBLIC_DEPLOYMENT_ENVIRONMENT` |

Source maps: **no se publican**. `productionBrowserSourceMaps` sigue apagado. La
correlación stack ↔ código se hace reconstruyendo el build a partir de
`app.build.id`. Documentado en la Fase 28.

---

## 13. Compatibilidad de navegadores

El SDK web de OTel requiere `PerformanceObserver`, `fetch` y `Promise`. Todos
disponibles en los navegadores que ya soporta Next 15 (Chrome 111+, Safari 16.4+,
Firefox 128+). El bootstrap comprueba las APIs necesarias y **se desactiva en
silencio** si falta alguna, en lugar de romper.

---

## 14. Impacto en el bundle

- `@opentelemetry/api` (~7 kB min) es lo único que puede quedar en el grafo
  principal, porque `TracingService` lo importa estáticamente para funcionar como
  no-op.
- Todo lo demás (SDK, exportador, instrumentaciones) entra por `import()`
  dinámico dentro de `initBrowserTelemetry()`, que solo se llama si la
  configuración está activa.
- Medición antes/después en `bundle-baseline.md` / `bundle-after.md`.

---

## 15. Consentimiento y privacidad

`NEXT_PUBLIC_OTEL_ENABLED` **por defecto es `false`**, incluso en producción.
Encenderlo es una decisión explícita del equipo, que debe ir acompañada de la
revisión descrita en [`05-data-privacy-policy.md`](./05-data-privacy-policy.md).

No se crea ningún banner nuevo: el proyecto ya tiene `/privacidad` y
`/terminos`, y añadir un mecanismo de consentimiento propio sin conocer la
política vigente sería peor que no hacerlo. Se documenta la decisión y se deja
el punto de enganche (`setTelemetryConsent()`) listo para cuando exista.

---

## 16. Retención

Definida en el Collector y en Jaeger, no en el frontend. Recomendación inicial:
**7 días** para trazas de navegador (volumen alto, valor decreciente), frente a
los 30 días habituales de backend. Documentado en la Fase 32.

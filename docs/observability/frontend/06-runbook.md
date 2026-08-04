# 06 — Runbook de desarrollo y operación

Guía práctica. La justificación de cada decisión está en los documentos 00–05.

---

## 1. Levantar el entorno completo en local

```bash
# 1. Collector + Jaeger
docker compose -f infra/otel-collector/docker-compose.yml up -d

# 2. Variables (en .env.local)
#    NEXT_PUBLIC_OTEL_ENABLED=true
#    NEXT_PUBLIC_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=/api/otel/traces
#    NEXT_PUBLIC_OTEL_SAMPLE_RATIO=1
#    NEXT_PUBLIC_OTEL_DEBUG=true
#    OTEL_COLLECTOR_TRACES_URL=http://localhost:4318/v1/traces

# 3. Frontend
yarn dev

# 4. Jaeger
#    http://localhost:16686  → servicio "corazon-migrante-web"
```

Las trazas tardan hasta **10 segundos** en aparecer: 5 s del `BatchSpanProcessor` del
navegador + 5 s del `batch` del Collector + 10 s de `decision_wait` del
`tail_sampling`. No es un fallo; es el diseño.

Para verlas antes, cambia de pestaña: eso dispara el `forceFlush()` de
`browser-lifecycle.ts`.

### Apagarlo

```bash
docker compose -f infra/otel-collector/docker-compose.yml down
```

La aplicación sigue funcionando igual con el Collector caído. Si no es así, es un bug.

---

## 2. Comprobar que funciona

| Qué | Cómo |
| --- | --- |
| El SDK arrancó | DevTools → Network → peticiones `POST` a `/api/otel/traces` con respuesta `202` |
| El SDK **no** arrancó | Con `OTEL_ENABLED=false` no debe existir ninguna petición, y el chunk de telemetría no debe aparecer en Network |
| Carga inicial | En Jaeger, span `documentLoad` |
| Navegación SPA | Navega entre pantallas → span `route.navigation` con `app.route.from` / `app.route.to` |
| Login | Intenta entrar → `auth.login` con `http.client` colgando |
| Errores | Provoca un error → `client.error` con `error.source` |

---

## 3. Activar la propagación al backend

**Este es el paso con más riesgo de toda la implementación.** Léelo entero antes.

Añadir `traceparent` convierte peticiones simples en peticiones con **preflight**. Si
el backend no lo acepta, **las llamadas fallan** y la aplicación deja de funcionar.

### Orden obligatorio

1. **Primero el backend.** Debe responder al preflight con:

   ```text
   Access-Control-Allow-Headers: content-type, authorization, traceparent, tracestate
   ```

   Y, si devuelve un identificador de soporte:

   ```text
   Access-Control-Expose-Headers: x-trace-id
   ```

   No ampliar CORS a `*` para resolver esto: mantener la lista explícita de orígenes.

2. **Verificar** con `curl`:

   ```bash
   curl -i -X OPTIONS https://EL-BACKEND/api/v1/me \
     -H "Origin: https://EL-FRONTEND" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: traceparent"
   ```

   La respuesta debe incluir `traceparent` en `Access-Control-Allow-Headers`.

3. **Después el frontend**: `NEXT_PUBLIC_OTEL_PROPAGATE_BACKEND=true`.

4. **Comprobar en staging** antes de producción: una petición `GET` sencilla y una
   `POST` autenticada.

### Marcha atrás

`NEXT_PUBLIC_OTEL_PROPAGATE_BACKEND=false` y desplegar. Vuelve a haber trazas de
navegador, pero sin correlación con el backend. La aplicación funciona igual.

---

## 4. Verificación distribuida completa (manual)

La suite E2E valida el tramo de navegador. Para comprobar la traza de punta a punta
hace falta el backend instrumentado:

1. Levanta Collector, Jaeger, backend y frontend.
2. `NEXT_PUBLIC_OTEL_PROPAGATE_BACKEND=true`.
3. Haz un login en el navegador.
4. En DevTools, copia el valor de la cabecera `traceparent` de la petición
   `POST /api/v1/auth/login`. Formato: `00-<trace_id>-<span_id>-01`.
5. Busca ese `trace_id` en Jaeger.
6. La traza debe mostrar, **bajo el mismo `trace_id`**:

   ```text
   auth.login                    (corazon-migrante-web)
     └── http.client
           └── HTTP POST
                 └── POST /api/v1/auth/login   (backend)
                       ├── AuthService.login
                       ├── postgresql query
                       └── redis get
   ```

7. Revisa que **ningún** span contenga correo, token, contraseña ni query string.

---

## 5. Despliegue en producción (Cloudflare Pages)

### Variables del build (públicas)

```env
NEXT_PUBLIC_OTEL_ENABLED=true
NEXT_PUBLIC_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=/otel/v1/traces
NEXT_PUBLIC_OTEL_SAMPLE_RATIO=0.05
NEXT_PUBLIC_OTEL_PROPAGATE_BACKEND=false
NEXT_PUBLIC_APP_VERSION=<versión de package.json>
NEXT_PUBLIC_BUILD_ID=$CF_PAGES_COMMIT_SHA
NEXT_PUBLIC_DEPLOYMENT_ENVIRONMENT=production
```

### Variable del servidor (privada, NO pública)

```env
OTEL_COLLECTOR_TRACES_URL=http://otel-collector.interno:4318/v1/traces
```

Se configura como variable de entorno de **Pages Functions**. No lleva prefijo
`NEXT_PUBLIC_`, así que no llega al navegador.

### Lo que nunca debe pasar

- Publicar la interfaz de Jaeger.
- Publicar el puerto 4318 del Collector.
- Poner cualquier credencial en una variable `NEXT_PUBLIC_*`.

---

## 6. Apagado de emergencia

```bash
# 1. Poner NEXT_PUBLIC_OTEL_ENABLED=false
# 2. Desplegar
```

Efecto inmediato: el SDK deja de existir en el artefacto. La aplicación es funcionalmente
idéntica — está probado en `tests/integration/observability-api-client.test.ts`.

Si hay que actuar **sin** desplegar: apagar el Collector. El gateway seguirá
respondiendo `202` y descartando los lotes; el navegador no notará nada.

---

## 7. Problemas frecuentes

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| No hay peticiones a `/otel/...` | `OTEL_ENABLED` no es `"true"` en **build time** | Es una variable de build, no de runtime: hay que reconstruir |
| Peticiones `415` | El `content-type` no es `application/json` | Revisar que el exportador es el de OTLP **HTTP/JSON** |
| Peticiones `413` | Lote mayor de 512 KB | Bajar `maxExportBatchSize` en `browser-exporter.ts` |
| `202` pero nada en Jaeger | El Collector no alcanza a Jaeger, o `tail_sampling` descartó la traza | `docker compose logs otel-collector`; recuerda que el 90 % de las trazas "normales" se descartan |
| Errores de CSP en consola | `connect-src` demasiado cerrado | El endpoint debe ser del mismo origen; revisar `public/_headers` |
| Llamadas al backend fallando tras activar propagación | El backend no acepta `traceparent` | Apagar `OTEL_PROPAGATE_BACKEND` y volver a la sección 3 |
| Spans sin anidar (`http.client` sin padre) | La operación instrumentada hace `await` **antes** de la llamada de red | Reordenar: la llamada debe salir antes del primer `await`. Ver la nota de contexto asíncrono en `tracing.service.ts` |
| Un atributo no aparece | No está en la lista blanca | Consola en desarrollo avisa: `atributo no permitido descartado`. Añádelo a `ATTR` **y** al documento 02 |

---

## 8. Correlacionar un error con el código (Fase 28)

Los source maps de producción **no se publican** (`productionBrowserSourceMaps` sigue
apagado). Para investigar un `client.error`:

1. Toma `app.release` del span: formato `1.0.0+a1b2c3d`.
2. `git checkout a1b2c3d`.
3. `yarn build` con las mismas variables → produce los mismos chunks.
4. Si hace falta el mapeo, activar `productionBrowserSourceMaps: true` **solo en esa
   reconstrucción local**, nunca en el despliegue.

Jaeger **no desminifica** nada por sí solo. No se debe afirmar lo contrario.

---

## 9. Comandos

```bash
yarn typecheck                       # tipos
yarn lint                            # ESLint
yarn test:unit                       # unitarias (incluye tests/unit/observability)
yarn test:integration:observability  # integración del cliente HTTP instrumentado
yarn test:e2e observability          # E2E (requiere el frontend levantado)
yarn build                           # build + tamaño de bundle
```

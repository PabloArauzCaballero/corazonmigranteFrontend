# 00 — Auditoría del estado actual (Fase 0)

> Fecha: 2026-08-03 · Rama: `main` · Alcance: `corazonmigranteFrontend`
>
> Este documento se escribió **antes** de instalar ninguna dependencia de
> OpenTelemetry. Es la base sobre la que se decide el diseño de las fases 1 y
> siguientes.

---

## 1. Arquitectura detectada

| Punto | Valor real |
| --- | --- |
| Framework | **Next.js 15.4.7**, App Router |
| React | **19.2.0** (`reactStrictMode: true`) |
| Bundler | Turbopack/webpack de Next (no hay Vite) |
| Lenguaje | TypeScript 5.9 en modo `strict`, `noEmit`, `moduleResolution: bundler` |
| **Estrategia de renderizado** | **`output: "export"`** → *export estático puro*. No hay SSR, ni ISR, ni Server Actions, ni Route Handlers en runtime |
| Router | App Router (`src/app`), 55 rutas; **una sola ruta dinámica**: `/(public)/[slug]` |
| `trailingSlash` | `true` |
| Imágenes | `images.unoptimized: true` (todo se sirve desde Cloudinary) |
| Estado servidor | **TanStack Query v5** (`@tanstack/react-query` 5.90) |
| Estado global | Context API (`SessionProvider`, `ToastProvider`, `ConfirmProvider`, `TutorialProvider`). **No hay Redux ni Zustand** |
| Cliente HTTP | **`fetch` nativo** envuelto en `apiRequest()` (`src/shared/api/client.ts`). **No hay Axios ni XMLHttpRequest** |
| Tiempo real | **SSE** (`EventSource`) en `src/features/notifications/use-admin-notifications.ts`. **No hay WebSockets** |
| Service Worker / PWA | **No existe** ninguno. Hay `src/app/manifest.ts` (untracked) pero sin SW registrado |
| Formularios | `react-hook-form` 7.68 + `zod` 4.2 vía `@hookform/resolvers` |
| Gestor de paquetes | **Yarn 4.9.2** (`packageManager`), `.yarnrc.yml` presente |
| Node | `engines.node >= 20.18.0`; CI usa Node 22 |
| Despliegue | **Cloudflare Pages**, artefacto estático `out/`. Cabeceras vía `public/_headers` |
| Tests | Jest 30 + jsdom + RTL (unit), `tsx` (smoke), Playwright 1.61 (E2E visual) |
| CI | `.github/workflows/ci.yml` → typecheck, lint, `yarn test`, `yarn build` |

### Diagrama actual (sin observabilidad)

```text
Navegador
   │
   ├── HTML/JS estático  ← Cloudflare Pages (artefacto `out/`)
   │
   ├── ClientRoleGuard (única protección de rutas privadas)
   │
   ├── TanStack Query
   │      └── apiRequest()  (src/shared/api/client.ts)
   │             └── fetch → NEXT_PUBLIC_API_BASE_URL  (backend externo, CORS)
   │
   ├── EventSource → /api/v1/admin/notifications/stream  (SSE, token en query string)
   │
   └── fetch directo → Cloudinary (upload firmado de imágenes)

(no hay servidor Next.js en producción: middleware.ts y /api/debug-log
 son código muerto en el despliegue actual)
```

### Consecuencias de `output: "export"` — las más importantes de toda la auditoría

1. **No existe `atlas-next-server`.** No hay proceso Node de Next en producción,
   así que **la Fase 27 (Next.js del lado servidor) no aplica**: no hay SSR, ni
   Server Components ejecutándose en runtime, ni Server Actions, ni Route
   Handlers. `instrumentation.ts` con `NodeSDK` no tendría dónde ejecutarse.
2. **`middleware.ts` no se ejecuta** (ya documentado en el propio archivo). La
   autorización efectiva la hace `ClientRoleGuard` en el cliente + el JWT en el
   backend.
3. **`src/app/api/debug-log/route.ts` no existe en producción.** El cliente ya lo
   sabe y solo lo llama en `NODE_ENV === "development"`.
4. **El gateway de telemetría del mismo origen no puede ser un Route Handler de
   Next.** Debe implementarse como **Cloudflare Pages Function**
   (`functions/otel/v1/traces.ts`), que sí se despliega junto al artefacto
   estático. En desarrollo, `next dev` sí levanta un servidor, así que allí se
   puede usar un Route Handler equivalente.

---

## 2. Puntos de instrumentación identificados

| # | Punto | Archivo | Nota |
| --- | --- | --- | --- |
| 1 | Bootstrap del navegador | `src/app/providers.tsx` (client) / `instrumentation-client.ts` | `layout.tsx` es Server Component: no puede inicializar OTel |
| 2 | Carga del documento | automático (`DocumentLoadInstrumentation`) | — |
| 3 | Navegación SPA | `usePathname()` desde un componente cliente montado en `AppProviders` | Solo hay un `[slug]` dinámico → plantillas triviales |
| 4 | HTTP saliente | `apiRequest()` en `src/shared/api/client.ts` (**único punto**) | Todo el tráfico de negocio pasa por aquí |
| 5 | HTTP fuera de `apiRequest` | `src/shared/api/files.ts:136` (Cloudinary), `src/features/auth/public-options.ts:5`, `src/features/public-view/public-view.api.ts:173` | Cloudinary es **tercero**: no propagar `traceparent` |
| 6 | Propagación W3C | `FetchInstrumentation.propagateTraceHeaderCorsUrls` | Cross-origin → requiere CORS en backend |
| 7 | Autenticación | `src/features/auth/auth.api.ts` (`login`, `registerPatient`) | |
| 8 | Sesión caducada / 401 | `handleUnauthorizedSession()` en `client.ts:184` | |
| 9 | Error Boundaries de Next | `src/app/global-error.tsx`, `(public)/error.tsx`, `admin/error.tsx`, `paciente/error.tsx`, `terapeuta/error.tsx` | Ya existen: **adaptar, no reemplazar** |
| 10 | `not-found` | `src/app/not-found.tsx` | |
| 11 | Errores globales JS | no existe listener hoy | `window.onerror` + `unhandledrejection` a crear |
| 12 | Formularios | `login-form.tsx`, `register-patient-form.tsx`, `booking-form.tsx`, `profile-forms.tsx`, `accounting-create.tsx`, … | Instrumentar solo los críticos |
| 13 | Upload | `src/shared/api/files.ts` (`uploadFile`, `uploadUserPhoto`) | 2 estrategias: multipart al backend y directo a Cloudinary |
| 14 | Download | `buildFileDownloadUrl()` + `my-downloadables.tsx` | |
| 15 | SSE | `use-admin-notifications.ts` | Conexión larga: spans por operación, nunca uno de horas |
| 16 | React Query | `AppProviders` (`QueryClient`) | Evitar duplicar con `FetchInstrumentation` |

---

## 3. Flujos críticos de negocio

| Flujo | Entrada | Endpoint | Span de negocio propuesto |
| --- | --- | --- | --- |
| Inicio de sesión | `LoginForm` | `POST /api/v1/auth/login` | `auth.login` |
| Cierre de sesión | `useSession().logout` | — (solo cliente) | `auth.logout` |
| Sesión caducada | `handleUnauthorizedSession` | — | `auth.session.expired` |
| Registro de paciente | `RegisterPatientForm` | `POST /api/v1/auth/register/patient` | `patient.register` |
| Solicitud de cita | `BookingForm` | `POST /api/v1/appointments` | `appointment.request` |
| Cambio de estado de cita | `RequestsTable` | `PATCH /api/v1/appointments/:id/status` | `appointment.status.update` |
| Actualización de perfil | `ProfileForms` | `PATCH /api/v1/me/*-profile` | `profile.update` |
| Subida de documento/imagen | `uploadFile` | Cloudinary + `/files/*` | `document.upload` |
| Descarga de recurso | `MyDownloadables` | `GET /files/:fileId/download` | `document.download` |
| Publicación editorial | `newsroom-admin-publications` | `POST/PATCH /admin/cms/*` | `publication.save` |
| Transacción contable | `accounting-create` | `POST /admin/accounting/*` | `accounting.transaction.create` |
| Navegación principal | `Sidebar`, `Link` | — | `route.navigation` |

---

## 4. Datos sensibles que maneja el frontend

Este es un producto de **salud mental para personas migrantes**. El riesgo de
privacidad es alto y condiciona todo el diseño.

| Categoría | Dónde aparece | Regla |
| --- | --- | --- |
| Credenciales | `login-form`, `register-patient-form` | Nunca en telemetría |
| **JWT** | `localStorage["cm_session"]`, header `Authorization`, **y en la query string del SSE** (`?token=…`) | Nunca; la URL del SSE **debe sanitizarse antes de cualquier atributo** |
| Cookie de rol | `cm_session_role` | Nunca |
| Datos personales | nombre, correo, teléfono, país, ciudad, ocupación | Nunca |
| Datos clínicos | síntomas, objetivos terapéuticos, notas de cita | Nunca |
| Datos financieros | módulo de contabilidad, pagos de citas | Nunca (solo categorías) |
| Nombres de archivo | `input.file.name` en `requestCloudinarySignature` | Nunca; solo extensión + bucket de tamaño |
| URLs firmadas | `signature.uploadUrl`, `secure_url` de Cloudinary | Nunca completas |
| Query strings | `?next=`, `?id=`, `?slug=`, `?token=` | Se descartan siempre |

### Riesgo ya presente en el repositorio (preexistente, fuera de este trabajo)

- `logApiCall()` en `client.ts:155` envía **request y response completos** a
  `/api/debug-log`. Está limitado a `NODE_ENV === "development"` y redacta claves
  que casen con `/password|token|secret|authorization/i`, pero **no** redacta
  correo, teléfono ni datos clínicos. No lo modifico (fuera de alcance), pero
  queda anotado: **la instrumentación OTel no debe imitar ese patrón**.
- El SSE lleva el **JWT en la query string**
  (`use-admin-notifications.ts:78`). Cualquier atributo de span que contenga esa
  URL filtraría el token. Se prohíbe explícitamente.

---

## 5. Restricciones de infraestructura

### CSP actual (`public/_headers`)

```text
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com data:;
img-src 'self' data: blob: https:;
connect-src *;              ← permisiva
frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'
```

`connect-src *` ya permite cualquier exportación, así que **OTel no obliga a
relajar la CSP**. Al contrario: la existencia de un endpoint de telemetría del
mismo origen es la oportunidad para **cerrar** `connect-src` a una lista
explícita. Se propone en la Fase 30.

### CORS

El backend es un origen distinto (`NEXT_PUBLIC_API_BASE_URL`). Propagar
`traceparent`/`tracestate` **dispara preflight** en peticiones que hoy no lo
tienen (los `GET` sin `Authorization` son simples). Si el backend no añade
`traceparent` a `Access-Control-Allow-Headers`, **las peticiones fallarían**.
Esto es el riesgo nº1 de la implementación y se mitiga con una bandera
independiente (`…_OTEL_PROPAGATE_BACKEND`) apagada por defecto.

### Versionado / source maps

- No hay `service.version` ni identificador de build hoy.
- `package.json.version = "1.0.0"` (estático).
- Next no emite source maps de producción por defecto (`productionBrowserSourceMaps` no está activado) → **no se publican**. Se mantiene así.
- Cloudflare Pages expone `CF_PAGES_COMMIT_SHA` en build → sirve como `app.build.id`.

---

## 6. Observabilidad existente

| Herramienta | Estado |
| --- | --- |
| Analítica comercial (GA, Meta, …) | **No existe** |
| Sentry / Datadog / LogRocket | **No existe** |
| Logging del cliente | `console.error` en los `error.tsx` y `logApiCall()` solo en dev |
| Web Vitals | **No se mide** |
| Banner de consentimiento | **No existe**. Hay páginas `/privacidad` y `/terminos` |

No hay nada que duplicar ni con lo que colisionar.

---

## 7. Riesgos identificados

| # | Riesgo | Severidad | Mitigación |
| --- | --- | --- | --- |
| R1 | Propagar `traceparent` provoca preflight y rompe llamadas al backend | **Alta** | Bandera `OTEL_PROPAGATE_BACKEND` apagada por defecto; lista blanca de URLs; documentar el cambio de CORS que el backend debe hacer |
| R2 | Fuga del JWT del SSE vía URL en atributos | **Alta** | Sanitizador obligatorio que elimina toda query string antes de escribir cualquier atributo |
| R3 | Peso del bundle (el SDK web de OTel no es pequeño) | Media | Carga **diferida y condicional**: si `OTEL_ENABLED=false` el SDK no se descarga (import dinámico) |
| R4 | Datos clínicos en mensajes de error del backend | **Alta** | No se registra `error.message` crudo del backend; solo `error.type` + categoría normalizada |
| R5 | `UserInteractionInstrumentation` captura clics indiscriminados | Media | **No se instala.** Se usan spans manuales explícitos |
| R6 | Doble contabilidad: `FetchInstrumentation` + span manual de `apiRequest` | Media | El span manual es de *negocio*; el de red lo crea la instrumentación. Jerarquía padre-hijo, no duplicado |
| R7 | Ejecución durante SSG (`next build` prerenderiza todo) | **Alta** | Guardas `typeof window === "undefined"` y bootstrap solo en `useEffect` de un client component |
| R8 | Sin servidor propio, el Collector queda expuesto | **Alta** | Pages Function como gateway del mismo origen con límite de tamaño, método y content-type |
| R9 | Fallo del Collector degradando la app | Media | Exportador con timeout corto, sin reintento infinito, errores silenciados |
| R10 | Alta cardinalidad por IDs en rutas/spans | Media | Plantillas de ruta y nombres estáticos; validado por test unitario |

---

## 8. Plan adaptado a este repositorio

Fases del prompt maestro y cómo aterrizan aquí:

| Fase | Aplica | Adaptación |
| --- | --- | --- |
| 1–2 Diseño y convenciones | Sí | Un solo servicio de navegador: `corazon-migrante-web` |
| 3 Dependencias | Sí | Solo paquetes de navegador. **Nada de `@opentelemetry/sdk-node`** |
| 4 Variables | Sí | Prefijo `NEXT_PUBLIC_OTEL_*`, validadas con zod dentro de `src/config/env.ts` (patrón ya existente) |
| 5 Bootstrap | Sí | `instrumentation-client.ts` (soportado por Next 15.3+) con carga diferida |
| 6 Resource | Sí | `service.name`, `service.version`, `deployment.environment.name`, `app.build.id` |
| 7 Exportación OTLP | Sí | OTLP **HTTP/JSON** (protobuf añade peso de bundle sin ventaja aquí) |
| 8 Document load | Sí | `DocumentLoadInstrumentation` sin spans por recurso |
| 9 Navegación SPA | Sí | Hook propio sobre `usePathname()` |
| 10 Fetch/XHR | Parcial | Solo `FetchInstrumentation`. **No** XHR (no se usa), **no** Axios |
| 11 Propagación | Sí | `tracecontext`; **sin `baggage`** (no hay atributo aprobado que propagar) |
| 12 CORS | Sí | Documentado; requiere cambio en backend |
| 13 Interacciones | Parcial | **Sin `UserInteractionInstrumentation`**; spans manuales |
| 14 TracingService | Sí | API no-op cuando está deshabilitado |
| 15 Spans de negocio | Sí | Catálogo en `03-business-spans-catalog.md` |
| 16 Formularios | Sí | Solo conteo de errores, nunca campos |
| 17 Archivos | Sí | Buckets de tamaño |
| 18 Errores globales | Sí | Listener propio con deduplicación |
| 19 Error Boundary | Sí | Reporter conectado a los `error.tsx` existentes |
| 20 Auth | Sí | Categorías normalizadas, sin enumeración de usuarios |
| 21 Sesión | Sí | `app.session.id` aleatorio en `sessionStorage`, rotado por pestaña |
| 22 Web Vitals | Parcial | Como **eventos** sobre el span de navegación; se documenta por qué Jaeger no es la plataforma de métricas |
| 23 React Query | Sí | Sin spans por lectura de caché |
| 24 Estado global | Mínimo | Solo Context; no hay transición crítica que justifique spans |
| 25 WebSockets/SSE | Parcial | SSE: `sse.connect` / `sse.message` con muestreo; **sin payloads** |
| 26 Service Worker/PWA | **No** | No existe SW. Se documenta la limitación |
| 27 Next.js servidor | **No** | No hay servidor. Se documenta |
| 28 Source maps | Sí | Política: no publicar; correlación por `app.release` + `app.build.id` |
| 29 Logging cliente | Sí | Enriquecer `console.error` existente con `trace_id`, sin interceptar la consola |
| 30 CSP | Sí | Cerrar `connect-src` |
| 31 Gateway | Sí | **Cloudflare Pages Function** + Route Handler equivalente en dev |
| 32 Collector | Sí | `infra/otel-collector/otel-collector.frontend.yml` + `docker-compose` local |
| 33 Sampling | Sí | Ratio por entorno + tail sampling en el Collector |
| 34 Privacidad | Sí | `05-data-privacy-policy.md` |
| 35 Consentimiento | Sí | Telemetría **desactivada por defecto**; se documenta la decisión |
| 36–38 Pruebas | Sí | Jest (unit/integración) + Playwright (E2E) |

---

## 9. Archivos que se van a modificar

Mínimo posible, y ninguno cambia lógica funcional:

- `src/config/env.ts` — añadir las variables `NEXT_PUBLIC_OTEL_*` al esquema zod.
- `src/app/providers.tsx` — montar el bootstrap de telemetría (un componente sin UI).
- `src/shared/api/client.ts` — envolver la petición en un span y sanear atributos.
- `src/app/global-error.tsx` y los cuatro `error.tsx` — llamar al reporter (sin tocar la UI).
- `public/_headers` — cerrar `connect-src`.
- `.env.example` — documentar las variables nuevas.
- `package.json` — dependencias y scripts de test nuevos.
- `tests/smoke/static-smoke.ts` — añadir los docs nuevos a la lista de requeridos.

## 10. Archivos que NO se deben modificar

- `next.config.ts` (`output: "export"` es una decisión de despliegue).
- `middleware.ts` (código muerto documentado).
- `src/shared/auth/cookies.ts`, `session.ts`, `guard.tsx` (seguridad).
- `src/app/api/debug-log/route.ts`.
- Todo `src/features/tutorial/**` (trabajo en curso sin commitear).
- Cualquier componente presentacional de `src/shared/ui/**`.

---

## 11. Estado del build ANTES de empezar (línea base)

> **El build del repositorio ya estaba roto antes de tocar nada.**

`yarn build` falla en la fase de lint con un error **preexistente** en código no
versionado:

```text
./src/features/tutorial/ui/tutorial-tour.tsx
29:5  Error: Calling setState synchronously within an effect can trigger cascading renders
      react-hooks/set-state-in-effect
```

No forma parte de este trabajo y **no se corrige aquí** (es WIP de otra tarea).
Para poder medir y validar, la línea base se toma con `yarn next build --no-lint`.

### Bundle antes de la implementación

Ver `docs/observability/frontend/bundle-baseline.md` (generado a partir de la
salida de `next build`). El criterio de aceptación de la Fase 3 es que el
**First Load JS compartido no crezca** cuando la telemetría está apagada, gracias
al import dinámico.

---

## 12. Criterio de aceptación de la Fase 0

- [x] No se ha instalado ninguna dependencia.
- [x] Se ha determinado la estrategia de renderizado real (`output: "export"`).
- [x] Se han localizado todos los puntos de red del cliente.
- [x] Se ha inventariado el dato sensible.
- [x] Se ha medido el estado del build previo (y documentado que ya fallaba).

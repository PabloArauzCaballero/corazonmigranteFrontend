# Pruebas unitarias

- **Fecha de evidencia:** 2026-08-03
- **Herramienta:** Jest 30.2 + `jest-environment-jsdom`
- **Comando:** `yarn test:unit` → `jest tests/unit --runInBand --forceExit`

## 1. Estado

**28 suites · 305 pruebas · 305 pasan · 13,0 s · exit 0** (medición del 2026-08-03, verificación final).

La línea base al inicio del trabajo documental era de 22 suites / 182 pruebas; la diferencia procede de trabajo concurrente del equipo sobre `tests/unit/observability/`, no de este plan. Ver [../reports/regression-validation.md](../reports/regression-validation.md).

`--runInBand` ejecuta en serie (evita contención en Windows) y `--forceExit` cierra tras terminar. Jest avisa de que hay operaciones asíncronas vivas al acabar — habitual en pruebas con `EventSource` o temporizadores, y por eso `--forceExit` está presente.

## 2. Suites por área

| Suite | Qué cubre |
|---|---|
| `session.test.ts` | `normalizeSession()`: envoltorios, mapeo de roles, banderas heredadas, extracción del token |
| `api-client.test.ts` | `apiRequest()`: construcción de URL, cabeceras, reintento por validación, manejo de errores |
| `normalizers.test.ts` | `isRecord()`, `getString()`, `normalizePaginatedResponse()` |
| `public-view-api.test.ts` / `public-view-normalizer.test.ts` | Landing configurable |
| `editorial-normalizer.test.ts` | Normalización del CMS |
| `landing-v2-schema.test.ts` | Esquema de la landing v2 |
| `observability/sanitize.test.ts` | Redacción de datos sensibles |
| `observability/route-template.test.ts` | `/admin/users/123` → `/admin/users/:id` |
| `observability/attributes.test.ts` | `safeAttributes()` y la lista blanca |
| `observability/telemetry-config.test.ts` | Validación de configuración (sustituye a zod en el camino caliente) |
| `observability/tracing-service.test.ts` | `runInSpan`, `startSpan`, `failSpan` |
| `observability/report-error.test.ts` | Reporte de excepciones |
| `observability/business-spans.test.ts` | Catálogo cerrado de spans de negocio |
| `smart-image.test.tsx` | `isValidSrc()`, fallback, estados |
| `admin-actions-smoke.test.ts` / `other-areas-actions-smoke.test.ts` | Existencia de acciones en pantallas admin |
| `no-local-fixtures.test.ts` | Que no se cuelen fixtures locales donde debe haber datos reales |
| `tutorial-*.test.ts(x)` (10 suites) | Máquina de estados, catálogo, registro, almacenamiento, progreso, rutas, centro, ejecución, tooltip, analítica |

## 3. Las dos suites más valiosas

**`observability/sanitize.test.ts`** — protege una salvaguarda de privacidad. Si la redacción se rompe, empiezan a salir datos de pacientes hacia el colector. Es la prueba con mayor consecuencia por fallo del proyecto. Las cinco suites de observabilidad añadidas recientemente refuerzan precisamente ese perímetro.

**`session.test.ts`** — `normalizeSession()` absorbe la heterogeneidad del backend. Un fallo ahí impide iniciar sesión a todo el mundo o asigna un rol incorrecto.

## 4. Qué no cubren

- Ningún componente de `shared/ui` salvo `SmartImage`.
- Ningún formulario.
- Ningún hook de feature (`useAdminNotifications` incluido).
- Ninguna interacción de usuario en pantallas de negocio.

Ver [strategy.md §3](strategy.md).

## 5. Convenciones

| Convención | Regla |
|---|---|
| Ubicación | `tests/unit/`, no junto al código |
| Nombre | `<módulo>.test.ts` · `.tsx` si renderiza |
| Datos | Sintéticos y deterministas |
| Red | Prohibida. `fetch` se simula |
| Fechas | Fijadas, nunca `Date.now()` sin control |

## 6. Cobertura

`jest.config.mjs` **no define** `coverageThreshold` ni recolección por defecto: no hay porcentaje publicado (brecha `TEST-04`).

Para obtenerlo puntualmente, sin modificar la configuración:

```bash
yarn jest tests/unit --coverage --runInBand
```

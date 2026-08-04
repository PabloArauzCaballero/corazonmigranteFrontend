# Informe de línea base

- **Fecha de evidencia:** 2026-08-03
- **Commit de referencia:** `82e37332`
- **Rama:** `main`
- **Naturaleza del trabajo:** `DOCUMENTAL` + `INSTRUMENTACIÓN SEGURA`. No se modificó ningún archivo ejecutable del producto.

Este informe fija el estado reproducible del repositorio **antes** de escribir documentación, para poder demostrar al final que el trabajo documental no introdujo regresiones.

---

## 1. Estado del repositorio al inicio

`git status --porcelain` devolvió **94 entradas** en la rama `main`. Se trata de trabajo preexistente del equipo, **no atribuible a este plan documental**, y se ha preservado íntegramente.

Composición de los cambios preexistentes:

| Tipo | Cantidad | Ejemplos |
|---|---:|---|
| Modificados (`M`) | 60 | `middleware.ts`, `next.config.ts`, `src/shared/api/client.ts`, `src/app/globals.css` |
| Eliminados (`D`) | 3 | `src/features/tutorial/guided-tour.tsx`, `portal-tours.ts`, `tutorial-launcher.tsx` |
| Sin seguimiento (`??`) | 31 | `functions/`, `infra/`, `public/`, `src/observability/`, `src/features/tutorial/{engine,ui,model,…}` |

Interpretación: hay dos líneas de trabajo abiertas en el repositorio — la **reescritura del módulo de tutoriales** (se borraron tres archivos monolíticos y aparecieron siete subcarpetas) y la **incorporación de observabilidad OpenTelemetry** (`src/observability/`, `functions/otel/`, `infra/otel-collector/`). Ambas están reflejadas en la documentación como estado actual.

**Regla aplicada:** ningún archivo preexistente fue sobrescrito, revertido ni reformateado.

---

## 2. Stack verificado

Todo lo siguiente está comprobado en el repositorio, no asumido.

| Elemento | Valor | Evidencia |
|---|---|---|
| Framework | Next.js `15.4.7` (App Router) | [package.json](../../package.json) |
| Runtime UI | React `19.2.0` / React DOM `19.2.0` | [package.json](../../package.json) |
| Lenguaje | TypeScript `^5.9.3`, modo `noEmit` para el chequeo | [tsconfig.json](../../tsconfig.json) |
| Gestor de paquetes | Yarn `4.9.2` (`packageManager`) | [package.json](../../package.json) |
| Node requerido | `>=20.18.0` (`engines`); ejecutado con **v22.23.1** | [package.json](../../package.json) |
| Estrategia de salida | `output: "export"` — **exportación estática** | [next.config.ts](../../next.config.ts) |
| Estilos | Tailwind CSS `^3.4.19` + `@tailwindcss/forms`, tokens HSL en CSS | [tailwind.config.ts](../../tailwind.config.ts), [globals.css](../../src/app/globals.css) |
| Primitivas UI | Radix (`dialog`, `label`, `slot`, `tabs`), `lucide-react`, `class-variance-authority` | [package.json](../../package.json) |
| Estado de servidor | TanStack React Query `^5.90.12` | [providers.tsx](../../src/app/providers.tsx) |
| Estado de cliente | React Context (sesión, toast, confirm, tutoriales) | [providers.tsx](../../src/app/providers.tsx) |
| Formularios | `react-hook-form` `^7.68.0` + `zod` `^4.2.1` vía `@hookform/resolvers` | [package.json](../../package.json) |
| Cliente HTTP | `fetch` envuelto en `apiRequest()` propio | [client.ts](../../src/shared/api/client.ts) |
| Observabilidad | OpenTelemetry Web SDK (`sdk-trace-web`, exportador OTLP HTTP) | [src/observability/](../../src/observability/) |
| Pruebas | Jest 30 + Testing Library (unitarias/componentes), Playwright `^1.61.1` (E2E) | [jest.config.mjs](../../jest.config.mjs), [playwright.config.ts](../../playwright.config.ts) |
| Despliegue | Cloudflare Pages (artefacto estático `out/` + Pages Function) | [public/_headers](../../public/_headers), [functions/otel/v1/traces.ts](../../functions/otel/v1/traces.ts) |
| Internacionalización | **No existe.** Textos en español incrustados en los componentes | Sin dependencia i18n en `package.json` |

---

## 3. Ejecución de la línea base

Todos los comandos se ejecutaron sobre Windows 11, shell Git Bash, en el directorio raíz del proyecto.

| # | Comando | Resultado | Duración | Observaciones |
|---|---|---|---|---|
| 1 | `node -v` / `yarn -v` | `v22.23.1` / `4.9.2` | — | Node por encima del mínimo declarado (`>=20.18.0`) |
| 2 | `yarn typecheck` (`tsc --noEmit`) | ✅ **exit 0** | ~35 s | Cero errores de tipos |
| 3 | `yarn lint` (`eslint . --max-warnings=0`) | ✅ **exit 0** | ~30 s | Cero errores y cero advertencias |
| 4 | `yarn test:unit` (`jest tests/unit`) | ✅ **exit 0** | 12,7 s | **22 suites, 182 pruebas, 182 pasan** |
| 5 | `yarn test:smoke` (`tsx tests/smoke/static-smoke.ts`) | ✅ **exit 0** | ~5 s | «Smoke estatico OK: rutas, documentacion y endpoints criticos existen» |
| 6 | `yarn build` (`next build` + export) | ✅ **exit 0** | ~60 s | **69 páginas** generadas, 3 exportadas por `generateStaticParams` |

No se ejecutó instalación (`yarn install`) porque `node_modules/` ya estaba presente y coherente con el lockfile; forzarla habría podido alterar `yarn.lock`, lo que la política de cero regresiones prohíbe.

### 3.1 Incidencia reproducible durante el build — resuelta y documentada

Los tres primeros intentos de `yarn build` fallaron con errores `ENOENT` sobre artefactos internos de Next.js:

```
[Error: ENOENT: ... open '.next\build-manifest.json']
[Error: ENOENT: ... open '.next\server\pages-manifest.json']
```

**Causa raíz identificada:** varios procesos `next build` y `tsc --noEmit` quedaron huérfanos de ejecuciones anteriores y competían por el mismo directorio `.next/`; uno lo limpiaba mientras otro leía sus manifiestos.

**Resolución:** se terminaron los procesos huérfanos y se eliminó `.next/` y `out/` (ambos son artefactos de build, ignorados por [.gitignore](../../.gitignore)). El build en serie completó con `exit 0`.

**Impacto en el producto:** ninguno. No se tocó código fuente, configuración ni dependencias. Queda registrado porque afecta a la reproducibilidad local y está recogido como runbook en [operations/runbooks/build-manifest-enoent.md](../operations/runbooks/build-manifest-enoent.md).

### 3.2 Comandos no ejecutados y por qué

| Comando | Motivo |
|---|---|
| `yarn test:e2e` (Playwright) | Requiere `playwright install chromium` (descarga de navegador) y un servidor levantado. No se ejecutó para no alterar el entorno ni la red. Los specs existen: `tests/e2e/landing-visual.spec.ts`, `tests/e2e/tutorials.spec.ts`. |
| `yarn test:integration:backend` | Depende de un backend NestJS real accesible. La política prohíbe llamar servicios productivos desde pruebas documentales. |
| `yarn check:public-endpoints` | Realiza peticiones de red a endpoints públicos reales. Mismo motivo. |
| Auditoría de dependencias (`yarn npm audit`) | No forma parte del pipeline actual; incorporarla es una propuesta, no un hecho. Ver [security/dependencies.md](../security/dependencies.md). |
| Lighthouse / axe automatizado | No hay herramienta de accesibilidad ni de rendimiento instalada en el repositorio. Registrado como brecha `A11Y-01` y `PERF-02`. |

Estas ausencias son **limitaciones reales registradas**, no omisiones silenciosas.

---

## 4. Línea base de bundle

Cifras tomadas de la salida real de `next build` (2026-08-03). Son la referencia contra la que se comparan futuros cambios.

| Métrica | Valor |
|---|---:|
| JS compartido por todas las rutas (First Load JS shared) | **100 kB** |
| — `chunks/4bd1b696-*.js` | 54,1 kB |
| — `chunks/5964-*.js` | 44 kB |
| — otros chunks compartidos | 2,23 kB |
| Ruta con mayor First Load JS | `/` — **194 kB** |
| Ruta con mayor peso propio | `/` — 28,3 kB |
| Segunda más pesada (propio) | `/admin/usuarios` — 17,3 kB |
| Ruta más ligera | `/_not-found`, `/privacidad`, `/terminos` — 101–104 kB |
| Total de rutas construidas | **69** |
| Rutas estáticas (`○`) | 64 |
| Rutas SSG con `generateStaticParams` (`●`) | 1 (`/[slug]` → `/inicio`) |
| Rutas dinámicas declaradas (`ƒ`) | 2 (`/api/debug-log`, `/api/otel/traces`) |

**Hallazgo relevante:** las dos rutas marcadas `ƒ (Dynamic)` **no existen en el artefacto exportado**. Se comprobó que `out/api/` no se genera. Son Route Handlers que solo funcionan en `next dev`; en producción la telemetría la atiende la Cloudflare Pages Function [functions/otel/v1/traces.ts](../../functions/otel/v1/traces.ts). Está documentado en [architecture/rendering-strategy.md](../architecture/rendering-strategy.md) y en [integrations/analytics.md](../integrations/analytics.md).

Existe además una medición previa del equipo en [observability/frontend/bundle-baseline.md](../observability/frontend/bundle-baseline.md), tomada antes de incorporar OpenTelemetry. Se conserva sin modificar.

---

## 5. Cobertura de pruebas disponible

`jest.config.mjs` no define umbrales de cobertura (`coverageThreshold`) ni recolección por defecto, por lo que **no hay un porcentaje de cobertura publicado** en la línea base. Lo que sí es verificable es el reparto de suites:

| Área | Suites | Archivos |
|---|---:|---|
| Tutoriales | 10 | `tutorial-{machine,catalog,registry,storage,progress,run,center,tooltip,analytics,app-routes}` |
| API y normalizadores | 5 | `api-client`, `normalizers`, `public-view-api`, `public-view-normalizer`, `editorial-normalizer` |
| Observabilidad | 2 | `observability/route-template`, `observability/sanitize` |
| Sesión y auth | 1 | `session.test.ts` |
| Acciones admin (smoke) | 2 | `admin-actions-smoke`, `other-areas-actions-smoke` |
| Landing / contenido | 2 | `landing-v2-schema`, `no-local-fixtures` |
| Componentes UI | 1 | `smart-image.test.tsx` |
| **Total** | **22** | **182 pruebas** |

Desequilibrio observable y registrado como brecha `TEST-01`: el módulo de tutoriales concentra el 45 % de las suites, mientras que flujos de negocio críticos como **reserva de cita**, **login** y **gestión de citas** no tienen prueba unitaria ni de componente propia. Ver [testing/strategy.md](../testing/strategy.md) y [governance/traceability-matrix.md](../governance/traceability-matrix.md).

---

## 6. Fallos preexistentes

**Ninguno.** Los seis comandos ejecutables de la línea base terminan en `exit 0`. No hay deuda de lint, tipos ni pruebas que haya que declarar como preexistente.

Esto es importante para la política de cero regresiones: cualquier fallo posterior en estos seis comandos sería, por definición, una regresión nueva.

---

## 7. Plan de reversión de los cambios propios

Todo lo aportado por este plan es aditivo y está confinado a rutas identificables:

| Ruta | Contenido |
|---|---|
| `docs/**` | Documentación (excepto los archivos preexistentes listados en §1, que no se tocan) |
| `scripts/check-doc-*.mjs`, `scripts/generate-*-inventory.mjs` | Validadores documentales no destructivos |
| `structurizr/workspace.dsl` | Modelo C4 |
| `mkdocs.yml` | Configuración del portal |
| `.github/workflows/docs.yml` | Pipeline documental (no altera el pipeline `ci.yml` existente) |

Reversión selectiva, sin tocar el trabajo preexistente:

```bash
git clean -fd docs/reports docs/getting-started docs/business docs/architecture/diagrams \
              docs/routes docs/components docs/design-system docs/data-and-state \
              docs/integrations docs/accessibility docs/performance docs/operations \
              docs/adr docs/governance structurizr
rm -f mkdocs.yml .github/workflows/docs.yml
rm -f scripts/check-doc-links.mjs scripts/check-doc-coverage.mjs scripts/generate-route-inventory.mjs
```

Ningún comando de reversión toca `src/`, `tests/`, `package.json`, `yarn.lock` ni los documentos preexistentes.

---

## 8. Criterio de salida de la Fase 0

| Criterio | Estado |
|---|---|
| Repositorio instalable y construible | ✅ `yarn build` exit 0 |
| Línea base reproducible y registrada | ✅ §3 y §4 |
| Cero archivos funcionales modificados durante el diagnóstico | ✅ Solo se eliminaron `.next/` y `out/` (artefactos ignorados por git) |
| Riesgos y cambios preexistentes diferenciados | ✅ §1 |
| Fallos preexistentes declarados | ✅ §6 — no hay |

**Fase 0 completada.**

---

Ver a continuación: [reports/graphify-audit.md](graphify-audit.md) · [reports/frontend-inventory.md](frontend-inventory.md) · [governance/zero-regression-policy.md](../governance/zero-regression-policy.md)

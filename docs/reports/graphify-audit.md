# Auditoría Graphify

- **Fecha de evidencia:** 2026-08-03
- **Artefacto analizado:** `graphify-out/` (build del 2026-08-03 15:40)
- **Commit del grafo:** `82e37332` (coincide con `HEAD`)
- **Naturaleza:** `DOCUMENTAL`

Esta auditoría es el punto de partida obligatorio del plan: ninguna documentación arquitectónica de este portal se escribió antes de contrastar el grafo con el repositorio real.

---

## 1. Artefactos encontrados

| Artefacto | Estado | Tamaño |
|---|---|---:|
| `graphify-out/graph.json` | ✅ presente | 2,56 MB |
| `graphify-out/graph.html` | ✅ presente | 1,98 MB |
| `graphify-out/GRAPH_REPORT.md` | ✅ presente | 25,4 kB |
| `graphify-out/manifest.json` | ✅ presente | 48,3 kB |
| `graphify-out/.graphify_labels.json` | ✅ presente | 5,3 kB |
| `graphify-out/cache/` | ✅ presente | — |
| Snapshots fechados | ✅ 11 snapshots, del `2026-07-19` al `2026-08-03` | — |

El directorio está en `.gitignore`, es decir **el grafo no se versiona**. Consecuencia operativa: quien clone el repositorio no dispone del grafo hasta ejecutar `python -m graphify update .`. Registrado como brecha `GOV-03`.

---

## 2. Métricas del grafo

| Métrica | Valor |
|---|---:|
| Archivos analizados | 292 |
| Palabras indexadas | ~281 045 |
| Nodos | **1 875** |
| Aristas | **4 635** |
| Comunidades detectadas | 176 (101 mostradas, 75 «finas» omitidas) |
| Extracción AST | 98 % `EXTRACTED` · 2 % `INFERRED` · 0 % `AMBIGUOUS` |
| Aristas inferidas | 81 (confianza media 0,67) |
| Coste en tokens | 0 entrada / 0 salida (análisis puramente estático) |

La calidad de extracción (98 % determinista) hace que el grafo sea utilizable como fuente de verdad estructural, con la salvedad del §6.

---

## 3. Inventario de nodos por categoría

Contrastado contra el árbol real del repositorio:

| Categoría | Verificado en el repositorio | Notas |
|---|---|---|
| Rutas y páginas | 60 `page.tsx` bajo `src/app/` | Coinciden con las 69 rutas del build |
| Layouts | 5 (`app`, `(public)`, `admin`, `paciente`, `terapeuta`) | Los tres privados envuelven `ClientRoleGuard` |
| Fronteras de error | 5 (`global-error`, `(public)`, `admin`, `paciente`, `terapeuta`) | Ver [architecture/error-boundaries.md](../architecture/error-boundaries.md) |
| Features | 17 carpetas bajo `src/features/` | `accounting`, `auth`, `booking`, `dashboard`, `downloadables`, `editorial`, `files`, `landing`, `newsroom`, `notifications`, `products`, `profile`, `public-content`, `public-view`, `therapy`, `tutorial`, `users` |
| Componentes compartidos | 19 archivos en `src/shared/ui/` | Ver [components/catalog.md](../components/catalog.md) |
| Clientes API | 1 genérico (`shared/api/client.ts`) + 1 `*.api.ts` por feature | Ver [integrations/backend-api.md](../integrations/backend-api.md) |
| Providers / contexts | 6 (`QueryClient`, `Session`, `Telemetry`, `Toast`, `Confirm`, `Tutorial`) | [providers.tsx](../../src/app/providers.tsx) |
| Módulo de observabilidad | 28 archivos en `src/observability/` | `browser/`, `config/`, `core/`, `react/` |
| Schemas y tipos | Zod en `config/env.ts`, `shared/auth/session.ts`, `tutorial/model/`, `public-view/` | — |
| Pruebas | 22 suites unitarias + 2 specs E2E + 1 integración + 1 smoke | — |
| Configuración | `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `eslint.config.mjs`, `jest.config.mjs`, `playwright.config.ts`, `postcss.config.mjs` | — |

---

## 4. Relaciones y hallazgos estructurales

### 4.1 Ciclos de importación

**En el grafo del commit `82e37332` (1 875 nodos):** ninguno.

**Tras refrescar el grafo el 2026-08-03 con el árbol de trabajo completo (3 309 nodos, 6 783 aristas):** **uno**.

```
src/observability/index.ts → react/telemetry-provider.tsx → shared/auth/use-session.tsx → src/observability/index.ts
```

La diferencia no es una regresión introducida por este trabajo: el grafo original se construyó desde el **commit**, y el módulo `src/observability/` está **sin confirmar**. Al reconstruirlo sobre el árbol real, el ciclo se hizo visible.

Es un ciclo de barril, funciona hoy, y está analizado en [architecture/module-dependencies.md](../architecture/module-dependencies.md). Registrado como `ARCH-01`.

**Lección metodológica:** un grafo construido desde el commit no describe el árbol de trabajo. En un repositorio con trabajo sin confirmar —como este, con 94 archivos modificados al inicio— conviene refrescarlo antes de afirmar propiedades estructurales.

### 4.2 Nodos de alta centralidad («god nodes»)

Son las abstracciones núcleo del sistema. Cualquier cambio en ellas tiene radio de impacto amplio y exige actualización documental.

| # | Nodo | Aristas | Ubicación | Papel |
|---:|---|---:|---|---|
| 1 | `humanizeApiError()` | 86 | `src/shared/api/errors.ts` | Traduce errores del backend a mensaje de usuario |
| 2 | `apiRequest()` | 64 | `src/shared/api/client.ts` | Única puerta de salida HTTP de la aplicación |
| 3 | `Button` | 52 | `src/shared/ui/button.tsx` | Primitiva de acción |
| 4 | `isRecord()` | 44 | `src/shared/api/normalizers.ts` | Guarda de tipos en la normalización de respuestas |
| 5 | `PageHeader()` | 42 | `src/shared/ui/page-header.tsx` | Cabecera estándar de pantalla |
| 6 | `cn()` | 41 | `src/shared/ui/*` | Composición de clases Tailwind |
| 7 | `getString()` | 38 | `src/shared/api/normalizers.ts` | Extracción segura de campos |
| 8 | `Card()` | 37 | `src/shared/ui/card.tsx` | Contenedor visual |
| 9 | `CardContent()` | 37 | `src/shared/ui/card.tsx` | Cuerpo del contenedor |
| 10 | `normalizePaginatedResponse()` | 34 | `src/shared/api/normalizers.ts` | Unifica formas de paginación del backend |

**Lectura arquitectónica:** cuatro de los diez nodos más conectados (`humanizeApiError`, `apiRequest`, `isRecord`, `getString`, `normalizePaginatedResponse` — cinco en realidad) pertenecen a la capa de acceso a datos. Esto confirma que **la defensa contra la variabilidad del backend está centralizada**, que es exactamente la propiedad que hace posible documentar los contratos en un solo sitio. Ver [integrations/backend-api.md](../integrations/backend-api.md).

Los otros cinco (`Button`, `PageHeader`, `cn`, `Card`, `CardContent`) son el núcleo real del sistema de diseño: si algo merece cobertura de pruebas de componente y regresión visual, es ese conjunto. Registrado como brecha `TEST-02`.

### 4.3 Cohesión de comunidades

Las comunidades con menor cohesión (nodos débilmente interconectados) señalan módulos que hacen demasiadas cosas:

| Comunidad | Cohesión | Nodos | Lectura |
|---|---:|---:|---|
| `landing-v2-page.tsx` | 0,06 | 41 | La landing configurable mezcla presentación, analítica de tutoriales y normalización |
| `compilerOptions` | 0,07 | 29 | Artefacto de configuración, no es código — se descarta |
| `session.ts` | 0,09 | 27 | Agrupa sesión, middleware y validación de catálogo de tutoriales: agrupación del algoritmo, no del código |
| `editorial.api.ts` | 0,09 | 42 | El módulo editorial/CMS es genuinamente amplio |
| `humanizeApiError` | 0,09 | 20 | Comunidad formada alrededor de un god node |
| `users.api.ts` | 0,11 | 40 | Mezcla usuarios, descargables y Hotmart |

**Advertencia metodológica:** una cohesión baja **no es por sí sola un defecto**. Las comunidades las forma un algoritmo de detección sobre el grafo, y agrupa nodos que el código mantiene separados en archivos distintos. Estas cifras se registran como *señales para revisión*, no como deuda confirmada. Ninguna refactorización se propone en este plan: sería `CAMBIO DE PRODUCTO` y requiere autorización explícita.

### 4.4 Nodos aislados

**513 nodos con ≤1 conexión.** Revisados por muestreo, se clasifican así:

| Clase | Ejemplos | ¿Es problema? |
|---|---|---|
| Variables de módulos de configuración | `__filename`, `__dirname`, `compat`, `eslintConfig`, `createJestConfig` | No — son artefactos de config |
| Entradas de `package.json` | cada dependencia es un nodo | No — ruido estructural |
| Constantes locales de un solo uso | `CAROUSEL_IMAGES`, `WEEKDAYS`, `TYPE_LABELS` | No — uso legítimamente local |
| Encabezados de documentos Markdown | `5. Restricciones de infraestructura`, `CI local` | No — el grafo indexa también la documentación |

**Conclusión:** el recuento de 513 está dominado por ruido de configuración y por el hecho de que Graphify indexa Markdown junto al código. **No se identificó código muerto relevante** por esta vía. Quien quiera perseguir código huérfano de verdad debería usar un análisis de alcance desde los puntos de entrada, no el recuento de nodos aislados.

### 4.5 Conexiones marcadas como «sorprendentes»

Las cinco conexiones que el informe destaca son **todas `INFERRED`** (confianza 0,67) y todas cruzan de código de producción a `tests/unit/tutorial-*.test.ts`:

```
firstString()      --indirect_call--> record()       (booking.api.ts → tutorial-storage.test.ts)
mapCatalogRow()    --indirect_call--> record()       (products.api.ts → tutorial-storage.test.ts)
overallCompletion()--indirect_call--> definition()   (tutorial-progress.ts → tutorial-catalog.test.ts)
```

**Veredicto tras verificación:** son **falsos positivos del inferidor**. `record()` y `definition()` son nombres genéricos de funciones auxiliares locales definidas dentro de los propios archivos de prueba; el inferidor las emparejó por nombre con llamadas homónimas en producción. No existe ninguna dependencia real de código de producción hacia código de pruebas — lo confirma que `tsconfig.json` excluye `tests/` del build y que `next build` compila sin ellos.

Se documenta explícitamente para que nadie tome estas aristas como arquitectura real.

---

## 5. Contraste Graphify ↔ repositorio

Este es el control que exige la Fase 1: el grafo no se acepta como verdad sin verificarlo.

| Dimensión | Graphify | Repositorio real | ¿Coincide? |
|---|---|---|---|
| Archivos analizados | 292 | `src/` + `tests/` + `docs/` + config ≈ mismo orden | ✅ |
| Ciclos de importación | 0 | `eslint` con `eslint-config-next` no reporta ciclos | ✅ |
| Rutas | nodos `page.tsx` | 60 archivos `page.tsx`, 69 rutas construidas | ✅ (la diferencia son `robots`, `sitemap`, `manifest`, `icon`, `not-found`, `loading`) |
| Cliente API único | `apiRequest()` con 64 aristas | Verificado: todos los `*.api.ts` importan de `shared/api/client` | ✅ |
| Módulo de tutoriales | nodos en `tutorial/{engine,model,registry,storage,ui,catalog,analytics}` | Coincide con las 7 subcarpetas sin seguimiento | ✅ |
| Observabilidad | nodos `src/observability/core/*` | 28 archivos verificados | ✅ |
| `middleware.ts` | nodo presente en comunidad `session.ts` | Presente **pero inerte en producción** (§6) | ⚠️ matiz crítico |

### 5.1 El matiz que el grafo no puede capturar

Graphify ve `middleware.ts` como un nodo conectado a `roleFromCookie()` y `hasRole()`, y en un análisis puramente estructural parecería que **el middleware protege las rutas privadas**. Es falso.

`next.config.ts` declara `output: "export"`. En ese modo Next.js genera HTML estático y **no ejecuta el middleware**: no hay servidor donde correrlo. La protección efectiva la aporta `ClientRoleGuard` en los layouts de `/admin`, `/paciente` y `/terapeuta`.

El propio código lo documenta en su cabecera ([middleware.ts:1-15](../../middleware.ts)), y este portal lo recoge en [security/frontend-security.md](../security/frontend-security.md) y [architecture/routing-and-navigation.md](../architecture/routing-and-navigation.md).

**Lección metodológica registrada:** un grafo de dependencias describe *qué se importa*, no *qué se ejecuta*. Toda afirmación sobre comportamiento en tiempo de ejecución de este portal se verificó contra configuración y salida de build, no solo contra el grafo.

---

## 6. Frescura y limitaciones del grafo

| Limitación | Detalle | Mitigación aplicada |
|---|---|---|
| **Frescura parcial** | El grafo se construyó a las 15:40 del 2026-08-03; varios archivos (`client.ts`, `use-session.tsx`, `use-admin-notifications.ts`, `env.ts`) se modificaron después. El propio tooling emitió avisos de posible obsolescencia. | Todos los archivos citados en este portal se leyeron directamente del disco, no del grafo |
| **No versionado** | `graphify-out/` está en `.gitignore` | Registrado como brecha `GOV-03` |
| **Estructura, no ejecución** | No modela `output: "export"`, guards de cliente ni orden de providers | Verificado contra `next.config.ts` y la salida de `next build` |
| **Indexa Markdown** | Encabezados de documentación aparecen como nodos y contaminan el recuento de aislados | Documentado en §4.4 |
| **Inferencias por nombre** | 81 aristas `INFERRED` producen falsos positivos entre producción y pruebas | Verificado y descartado en §4.5 |

---

## 7. Entregables generados a partir de esta auditoría

| Documento | Contenido derivado |
|---|---|
| [architecture/module-dependencies.md](../architecture/module-dependencies.md) | Capas, dirección de dependencias, ausencia de ciclos, god nodes |
| [architecture/integration-map.md](../architecture/integration-map.md) | Mapa de integraciones a partir de los clientes API detectados |
| [governance/traceability-matrix.md](../governance/traceability-matrix.md) | Trazabilidad negocio → ruta → componente → API → prueba |
| [components/catalog.md](../components/catalog.md) | Catálogo priorizado por centralidad del grafo |

---

## 8. Criterio de salida de la Fase 1

| Criterio | Estado |
|---|---|
| Artefactos Graphify localizados y analizados | ✅ §1, §2 |
| Nodos inventariados y contrastados con el repositorio | ✅ §3, §5 |
| Relaciones, ciclos, centralidad y huérfanos revisados | ✅ §4 |
| Falsos positivos verificados y descartados | ✅ §4.5 |
| Limitaciones del grafo registradas formalmente | ✅ §6 |
| Documentación arquitectónica derivada, no inventada | ✅ §7 |

**Fase 1 completada.**

### Cómo reproducir esta auditoría

```bash
python -m graphify update .                       # refresca el grafo (sin coste de API)
python -m graphify query "<pregunta>"             # subgrafo acotado
python -m graphify path "<A>" "<B>"               # relación entre dos nodos
cat graphify-out/GRAPH_REPORT.md                  # informe completo
```

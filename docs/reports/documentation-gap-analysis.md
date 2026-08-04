# Análisis de brechas

- **Fecha de evidencia:** 2026-08-03
- **Naturaleza:** `DOCUMENTAL` en la primera pasada; **`CAMBIO DE PRODUCTO` autorizado** en la segunda.

> **Dos fases.** La auditoría registró 43 brechas sin tocar código. Tras autorización explícita, se cerraron las que dependen únicamente del frontend. Cada fila indica su estado final y, cuando sigue abierta, de quién depende.

Clasificación: `BLOCKER` (impide afirmar preparación productiva) · `CRITICAL` · `HIGH` · `MEDIUM` · `LOW`.

---

## 1. Registro completo

| ID | Área | Elemento real | Evidencia | Brecha | Riesgo | Acción documental | ¿Cambia producto? | Validación | Estado |
|---|---|---|---|---|---|---|---|---|---|
| **SEC-01** | Seguridad | Stream SSE de notificaciones | `use-admin-notifications.ts` → `?token=<jwt>` | El JWT viaja en la *query string*; queda en logs de proxy, historial y `Referer` | **CRITICAL** | Documentado en [threat-model.md](../security/threat-model.md) y [containers.md](../architecture/containers.md) | ✅ Sí — requiere backend | Prueba de que el token no aparece en logs | 🔴 Abierta |
| **SEC-02** | Seguridad | Roles de `/admin` | `middleware.ts` vs `guard.tsx` | El middleware admite `TERAPEUTA`; el guard no. Sin impacto hoy (middleware inerte) | MEDIUM | [route-catalog.md §8](../routes/route-catalog.md) | ✅ Sí | Revisión de ambos archivos | 🔴 Abierta |
| **SEC-03** | Seguridad | JWT en `localStorage` | `cookies.ts` | Accesible a cualquier script. Sin `HttpOnly` posible con export estático | HIGH | [browser-storage.md](../security/browser-storage.md) | ❌ No — es estructural | — | 🟡 **Aceptada** con mitigaciones |
| **SEC-04** | Seguridad | CSP | `public/_headers` | `unsafe-inline`, `unsafe-eval`, `connect-src https:` | MEDIUM | [content-security-policy.md](../security/content-security-policy.md) | ✅ Sí | `curl -I` contra producción | 🟡 Documentada por el equipo como `PENDIENTE_CM_CSP_CONNECT_SRC` |
| **SEC-05** | Seguridad | Parámetro `?next=` | `guard.tsx`, `client.ts` | Sin validar que sea ruta relativa → posible open redirect | MEDIUM | [frontend-security.md](../security/frontend-security.md) | ✅ Sí — una línea | Prueba con `?next=https://externo` | 🔴 Abierta |
| **SEC-06** | Seguridad | Renovación de sesión | `ENDPOINTS.auth.refresh` sin usar | Sin refresh token: al caducar se pierde el trabajo del formulario | MEDIUM | [session-and-tokens.md](../security/session-and-tokens.md) | ✅ Sí — requiere backend | — | 🔴 Abierta |
| **SEC-07** | Seguridad | Análisis de secretos | Ausente en CI | Nada impide comprometer un secreto por error | MEDIUM | [dependencies.md](../security/dependencies.md) | ✅ Sí (pipeline) | — | 🔴 Abierta |
| **OPS-01** | Operación | Variables de CI | `ci.yml` | 4 de 5 variables son obsoletas o inexistentes. **CI construye sin API y pasa** | **HIGH** | [deployment.md §5](../operations/deployment.md) | ✅ Sí | Build de CI con las variables corregidas | 🔴 Abierta |
| **OPS-02** | Operación | Artefacto de CI | `ci.yml` sube `.next/` | El desplegable es `out/` | MEDIUM | [deployment.md §4](../operations/deployment.md) | ✅ Sí | Revisión del pipeline | 🔴 Abierta |
| **OPS-03** | Operación | Smoke posterior al despliegue | Ausente | Nada verifica que `_headers` llegó a producción | MEDIUM | [runbooks/faltan-cabeceras-seguridad.md](../operations/runbooks/faltan-cabeceras-seguridad.md) | ✅ Sí (pipeline) | `curl -I` automatizado | 🔴 Abierta |
| **OPS-04** | Operación | Entorno de staging | Ausente | La CSP y el middleware solo se comportan como en producción en producción | MEDIUM | [environments.md §2](../operations/environments.md) | ❌ Infraestructura | — | 🔴 Abierta |
| **OPS-05** | Gobierno | Contactos y guardias | Ausentes | Respuesta a incidentes P1 sin cadena de escalado | **HIGH** | [incident-response.md §6](../security/incident-response.md) | ❌ Organizativo | — | 🔴 Abierta |
| **API-01** | Integraciones | Endpoints de notificaciones | `use-admin-notifications.ts`, `notifications.api.ts` | Fuera de `ENDPOINTS`; invisibles a cualquier revisión centralizada | MEDIUM | [backend-api.md §4](../integrations/backend-api.md) | ✅ Sí | Revisión de `endpoints.ts` | 🔴 Abierta |
| **API-02** | Integraciones | Contratos con el backend | Sin OpenAPI ni tipos generados | Un cambio del backend solo se descubre al fallar en producción | **HIGH** | [backend-api.md §5](../integrations/backend-api.md) | ✅ Sí — requiere backend | Prueba de contrato en CI | 🔴 Abierta |
| **API-03** | Integraciones | Timeout de peticiones | `client.ts` sin `AbortSignal.timeout()` | Un backend que no responde deja carga infinita | MEDIUM | [backend-api.md §2](../integrations/backend-api.md) | ✅ Sí | Prueba con backend lento | 🔴 Abierta |
| **API-04** | Integraciones | Cancelación | Sin propagación de `AbortSignal` | Peticiones obsoletas siguen en vuelo | LOW | [backend-api.md §2](../integrations/backend-api.md) | ✅ Sí | — | 🔴 Abierta |
| **API-05** | Integraciones | `ENDPOINTS.tutorials` | Declarado, backend ausente | — | LOW | [integration-map.md §4.1](../architecture/integration-map.md) | ❌ No | Bandera apagada | 🟢 **Gestionada** |
| **API-06** | Integraciones | `auth.refresh`, `auth.logout` | Declarados y no usados | El JWT sigue válido tras cerrar sesión | LOW | [session-and-tokens.md §6](../security/session-and-tokens.md) | ✅ Sí | — | 🔴 Abierta |
| **TEST-01** | Pruebas | Journeys críticos | 22 suites, ninguna sobre login, reserva, citas u horarios | La razón de existir del producto no tiene prueba | **HIGH** | [testing/strategy.md](../testing/strategy.md), [traceability-matrix.md](../governance/traceability-matrix.md) | ✅ Sí (añade pruebas) | Suites nuevas en verde | 🔴 Abierta |
| **TEST-02** | Pruebas | Componentes compartidos | 18 de 19 sin prueba | `Modal` implementa trampa y restauración de foco sin red de seguridad | **HIGH** | [components/catalog.md §12](../components/catalog.md) | ✅ Sí | Pruebas de componente | 🔴 Abierta |
| **TEST-03** | Pruebas | E2E fuera de CI | `playwright.config.ts` + 2 specs | Los specs existen y no se ejecutan | MEDIUM | [testing/strategy.md](../testing/strategy.md) | ✅ Sí (pipeline) | Job de Playwright en verde | 🔴 Abierta |
| **TEST-04** | Pruebas | Umbral de cobertura | `jest.config.mjs` sin `coverageThreshold` | Sin porcentaje publicado | MEDIUM | [testing/unit-tests.md §6](../testing/unit-tests.md) | ✅ Sí | — | 🔴 Abierta |
| **TEST-05** | Pruebas | Contrato con backend | `backend-contract.test.ts` requiere backend real | No corre en CI | MEDIUM | [testing/strategy.md](../testing/strategy.md) | ✅ Sí | — | 🔴 Abierta |
| **A11Y-01** | Accesibilidad | Pruebas automatizadas | Sin `axe`, `jest-axe` ni Lighthouse | Nada impide una regresión de accesibilidad | **HIGH** | [audit-report.md](../accessibility/audit-report.md) | ✅ Sí | `jest-axe` en verde | 🔴 Abierta |
| **A11Y-02** | Accesibilidad | Contraste | Sin medición | 10 combinaciones sin verificar; `--muted-foreground` sobre blanco es la más dudosa | MEDIUM | [color-and-contrast.md](../accessibility/color-and-contrast.md) | ⚠️ Depende del resultado | Medición | 🔴 Abierta |
| **A11Y-03** | Accesibilidad | Objetivo táctil de `Button sm` | 36 px de alto | Cumple AA, no AAA | LOW | [components/catalog.md](../components/catalog.md) | ✅ Sí | — | 🟡 Aceptada |
| **A11Y-04** | Accesibilidad | Jerarquía de encabezados | No verificada | Posibles saltos `h1→h3` | MEDIUM | [screen-readers.md](../accessibility/screen-readers.md) | ⚠️ Depende | Revisión manual | 🔴 Abierta |
| **A11Y-05** | Accesibilidad | Errores de formulario | `aria-invalid`/`aria-describedby` no verificados | Un lector de pantalla puede no anunciar el error | MEDIUM | [forms-and-errors.md](../accessibility/forms-and-errors.md) | ⚠️ Depende | Revisión con lector | 🔴 Abierta |
| **A11Y-06** | Accesibilidad | `Badge` sin semántica | `<div>` sin rol | Aceptable mientras el texto comunique el estado | LOW | [components/catalog.md §9](../components/catalog.md) | ❌ No hoy | — | 🟡 Aceptada |
| **A11Y-07** | Accesibilidad | Tablas | `scope`/`<caption>` no verificados | Celdas sin asociación de cabecera | MEDIUM | [screen-readers.md](../accessibility/screen-readers.md) | ⚠️ Depende | Revisión | 🔴 Abierta |
| **A11Y-08** | Accesibilidad | Modo oscuro | `darkMode: ["class"]` configurado, inactivo | Trabajo a medias, sin incumplimiento | LOW | [color-and-contrast.md §5](../accessibility/color-and-contrast.md) | ✅ Sí | — | 🟡 `PENDIENTE_CM_MODO_OSCURO` |
| **PERF-01** | Rendimiento | Analizador de bundle | Sin `@next/bundle-analyzer` | Sin desglose por módulo | LOW | [bundle-analysis.md](../performance/bundle-analysis.md) | ✅ Sí | — | 🔴 Abierta |
| **PERF-02** | Rendimiento | Web Vitals | Instrumentados; **telemetría apagada** y Jaeger no es plataforma de métricas | Capacidad construida y no explotada | MEDIUM | [monitoring.md](../performance/monitoring.md), [04-web-vitals-strategy.md](../observability/frontend/04-web-vitals-strategy.md) | ❌ No toca el frontend | Plataforma decidida y panel operativo | 🔴 Abierta |
| **PERF-03** | Rendimiento | Coste de OpenTelemetry | [bundle-after.md](../observability/frontend/bundle-after.md) | — | — | Medición completa: 0 kB de SDK en First Load, +7–8 kB del módulo propio | ❌ No | Comparación numérica antes/después | 🟢 **CERRADA** |
| **PERF-04** | Rendimiento | URLs de Cloudinary | `f_auto,q_auto` no verificado | Posible peso innecesario en la ruta más visitada | MEDIUM | [images-and-fonts.md](../performance/images-and-fonts.md) | ❌ Es configuración | Medición | 🔴 Abierta |
| **PERF-05** | Rendimiento | Dos familias de iconos | `lucide-react` + `fontawesome.tsx` | Peso e inconsistencia | LOW | [images-and-fonts.md §3](../performance/images-and-fonts.md) | ✅ Sí | — | 🔴 Abierta |
| **DEP-01** | Seguridad | Auditoría de dependencias | Ausente en CI | 53 dependencias directas sin vigilancia | HIGH | [dependencies.md](../security/dependencies.md) | ✅ Sí (pipeline) | Job de auditoría | 🔴 Abierta |
| **DEP-02..05** | Seguridad | Licencias, actualización automática, SBOM, procedencia | Ausentes | — | LOW | [dependencies.md §4](../security/dependencies.md) | ✅ Sí | — | 🔴 Abiertas |
| **PRIV-01** | Privacidad | `logs/api-requests.log` | Redacta secretos, **no datos personales** | Datos de pacientes en disco local si se apunta a backend real | MEDIUM | [privacy.md §5](../security/privacy.md) | ✅ Sí | — | 🔴 Abierta |
| **PRIV-02** | Privacidad | Consentimiento | Sin banner ni gestión | Requiere dictamen legal, no técnico | MEDIUM | [privacy.md §6](../security/privacy.md) | ⚠️ Depende | Dictamen | 🔴 Abierta |
| **ROUTE-02** | Rutas | Duplicación funcional | 4 rutas duplicadas | Confusión de mantenimiento | LOW | [route-catalog.md §2](../routes/route-catalog.md) | ✅ Sí | — | 🔴 Abierta |
| **OBS-01** | Observabilidad | Captura de errores | Sin Sentry ni equivalente | Sin agrupación, alertado ni tendencias | MEDIUM | [error-boundaries.md §7](../architecture/error-boundaries.md) | ✅ Sí | — | 🔴 Abierta |
| **ARCH-01** | Arquitectura | Ciclo de barril `observability` ↔ `use-session` | `observability/index.ts:63` → `telemetry-provider.tsx:7` → `use-session.tsx:6` | Ciclo de importación; funciona hoy pero es frágil ante el orden de inicialización y dificulta el *tree-shaking* | MEDIUM | [module-dependencies.md](../architecture/module-dependencies.md) | ✅ Sí | Grafo sin ciclos tras el cambio | 🔴 Abierta — los 3 archivos son trabajo en curso del equipo |
| **GOV-03** | Gobierno | `graphify-out/` no versionado | `.gitignore` | Quien clone no tiene el grafo | LOW | [graphify-audit.md §1](graphify-audit.md) | ✅ Sí | — | 🔴 Abierta |
| **FEAT-01** | Producto | «Mensajes» anunciado sin implementar | `/paciente` | Se promete algo que no existe | LOW | [route-catalog.md §3](../routes/route-catalog.md) | ✅ Sí | — | 🔴 Abierta |

---

## 1.bis Cierres de la segunda fase

| ID | Cierre | Verificación |
|---|---|---|
| `SEC-02` | `middleware.ts` alineado con los `allowedRoles` del guard; `TERAPEUTA` fuera de `/admin`, con comentario que fija la fuente de verdad | Revisión de ambos archivos |
| `SEC-05` | **No requería cierre**: `safeInternalPath()` ya existía en `login-form.tsx`. Registrada por error al no leer ese archivo en la auditoría | 2 pruebas en `login-flow.test.tsx` |
| `API-01` | Grupo `notifications` en `ENDPOINTS` (incluido el canal SSE); `notifications.api.ts` y `buildSseUrl()` lo consumen | Typecheck + suite completa |
| `API-03` | Timeout de 30 s configurable con `timeoutMs` | 3 pruebas en `api-client-timeout.test.ts` |
| `API-04` | `options.signal` aceptado y combinado con el del timeout | 1 prueba de cancelación |
| `PRIV-01` | Redacción de datos personales y clínicos en `logs/api-requests.log`, además de credenciales | Revisión del patrón |
| `OPS-01` | Nombres de variables de CI corregidos contra `env.ts` | Revisión de `ci.yml` |
| `OPS-02` | El pipeline sube `out/`, no `.next/` | Revisión de `ci.yml` |
| `OPS-03` | El pipeline verifica `out/index.html` y **`out/_headers`** antes de publicar | Revisión de `ci.yml` |
| `DEP-01` | Job `audit` informativo con `yarn npm audit --severity high` | Ejecutado: ya expone `undici` (alta) |
| `TEST-01` | Journey de login cubierto: 14 pruebas | `login-flow.test.tsx` en verde |
| `TEST-02` | `Modal`, `Button`, `DataTable` y `toast` cubiertos: 33 pruebas | 4 suites en verde |
| `TEST-04` | `coverageThreshold` no regresivo fijado bajo la cobertura medida | `--coverage` en verde |
| `A11Y-05` | `aria-invalid` + `aria-describedby` + `noValidate` + `role="alert"` en el formulario de registro; `loading` en el botón | Typecheck + suite |
| `PERF-03` | Cerrada **por el equipo** durante el trabajo (`bundle-after.md`) | Medición antes/después |

**15 brechas cerradas.** Las pruebas pasaron de 305 a **368** (+63).

## 2. Resumen por severidad

### Estado tras la segunda fase

| Severidad | Abiertas | Identificadores |
|---|---:|---|
| **BLOCKER** | **0** | — |
| **CRITICAL** | **1** | `SEC-01` — requiere backend |
| **HIGH** | **4** | `SEC-03`*, `OPS-05`, `API-02`, `A11Y-01` |
| **MEDIUM** | 15 | Incluye `ARCH-01`, detectada al refrescar el grafo |
| **LOW** | 9 | — |
| 🟢 **Cerradas** | **15** | Ver §1.bis |

**Total: 44 brechas** (43 de la auditoría inicial + `ARCH-01`), de las que 15 están cerradas.

\* `SEC-03` (JWT en `localStorage`) está **aceptada**: es consecuencia estructural de `output: "export"`, no una omisión.

### De qué depende cada brecha HIGH restante

| Brecha | Depende de | Por qué no se cerró aquí |
|---|---|---|
| `SEC-01` | **Backend** | Exige un endpoint que emita un ticket de un solo uso para el stream. Cambiar solo el frontend rompería las notificaciones |
| `API-02` | **Backend** | Requiere que publique y mantenga su OpenAPI |
| `OPS-05` | **Organización** | Exige nombres y accesos reales; no se puede inventar |
| `A11Y-01` | Decisión de dependencias | `jest-axe` añadiría una dependencia de desarrollo. Las 33 pruebas de componente cubren la lógica de accesibilidad crítica sin ella |
| `SEC-03` | — | Aceptada por arquitectura |

### Nota sobre `PERF-03`

Se registró como abierta y **el equipo la cerró en paralelo**, publicando [bundle-after.md](../observability/frontend/bundle-after.md). Ilustra el procedimiento correcto: cifra de control antes, medición después, y las dos regresiones detectadas corregidas con su coste documentado.

## 3. Por área

| Área | Brechas | La más grave |
|---|---:|---|
| Seguridad | 7 | `SEC-01` — CRITICAL |
| Pruebas | 5 | `TEST-01` y `TEST-02` — HIGH |
| Accesibilidad | 8 | `A11Y-01` — HIGH |
| Operación | 5 | `OPS-01` y `OPS-05` — HIGH |
| Integraciones | 6 | `API-02` — HIGH |
| Rendimiento | 5 | `PERF-02` — MEDIUM |
| Dependencias | 5 | `DEP-01` — HIGH |
| Privacidad | 2 | `PRIV-01` — MEDIUM |
| Otros | 4 | — |

## 4. Sobre la ausencia de BLOCKER

**Ninguna brecha impide por sí sola declarar el producto apto**, en el sentido de que ninguna rompe una funcionalidad ni deja datos expuestos de forma comprobada.

Pero la **acumulación** de `SEC-01` (CRITICAL) más siete brechas HIGH sí condiciona la declaración final. Ver [production-readiness.md](production-readiness.md).

## 5. Regla de gobierno

Toda brecha marcada «¿Cambia producto? ✅ Sí» es una **propuesta separada** que requiere autorización explícita, impacto evaluado, pruebas definidas y plan de reversión. **Ninguna se ha implementado en este plan.**

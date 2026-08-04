# Documentación técnica — Frontend Corazón Migrante

- **Versión documentada:** commit `82e37332` · **Fecha de evidencia:** 2026-08-03
- **Propietario:** ver [governance/ownership.md](governance/ownership.md)

---

## Qué es este producto

**Corazón Migrante** ofrece acompañamiento psicológico y emocional a personas migrantes y sus familias.

Este frontend cubre cinco superficies: un **sitio público** (landing, biblioteca, cursos, noticias, textos legales), y cuatro **portales privados** para paciente, terapeuta, administración y contabilidad.

## Stack verificado

| | |
|---|---|
| Framework | Next.js **15.4.7** (App Router) · React **19.2.0** |
| Lenguaje | TypeScript 5.9 |
| Gestor | Yarn **4.9.2** · Node ≥ 20.18.0 |
| **Renderizado** | **`output: "export"` — HTML estático** |
| Estilos | Tailwind 3.4 + Radix + tokens HSL |
| Estado de servidor | TanStack React Query 5 |
| Formularios | react-hook-form + zod |
| Observabilidad | OpenTelemetry Web SDK |
| Despliegue | Cloudflare Pages (`out/` + Pages Function) |
| Backend | NestJS en `/api/v1` (sistema aparte) |

## Lo primero que hay que saber

> **`output: "export"` condiciona todo.** No hay servidor de aplicación: `middleware.ts` **no se ejecuta**, los Route Handlers `/api/*` **no se exportan**, las cabeceras viven en `public/_headers` y el JWT está en `localStorage` porque no hay quien emita una cookie `HttpOnly`.
>
> **El frontend no puede proteger datos, solo la experiencia.** El HTML de los portales privados es descargable sin sesión. Quien decide qué información se entrega es el backend, validando el JWT en cada endpoint.

Detalle en [ADR-0002](adr/ADR-0002-exportacion-estatica.md) y [security/frontend-security.md](security/frontend-security.md).

---

## Empezar

| Documento | Contenido |
|---|---|
| [getting-started/environment-variables.md](getting-started/environment-variables.md) | Variables, catálogo completo y trampas |
| [operations/build.md](operations/build.md) | Comandos y fases del build |
| [testing/strategy.md](testing/strategy.md) | Cómo y qué se prueba |
| [operations/runbooks/](operations/runbooks/README.md) | 13 runbooks de incidentes |

```bash
yarn install --frozen-lockfile
# .env.local con NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
yarn dev            # puerto 4173
yarn test:ci        # lint + typecheck + unit + smoke
yarn build          # 69 rutas → out/
```

## Producto

| Documento | Contenido |
|---|---|
| [routes/route-catalog.md](routes/route-catalog.md) | **Las 69 rutas**, con layout, roles y peso |
| [business/user-journeys.md](business/user-journeys.md) | Los 10 journeys verificados |
| [business/actors-and-roles.md](business/actors-and-roles.md) | 5 roles, 12 permisos |
| [reports/frontend-inventory.md](reports/frontend-inventory.md) | Inventario, incluido **lo que no existe** |

## Arquitectura

| Documento | Contenido |
|---|---|
| [architecture/overview.md](architecture/overview.md) | **Punto de entrada** |
| [architecture/system-context.md](architecture/system-context.md) · [containers.md](architecture/containers.md) | C4 niveles 1 y 2 |
| [architecture/rendering-strategy.md](architecture/rendering-strategy.md) | Exportación estática e hidratación |
| [architecture/routing-and-navigation.md](architecture/routing-and-navigation.md) | Rutas y guards |
| [architecture/state-management.md](architecture/state-management.md) | Los cuatro tipos de estado |
| [architecture/data-flow.md](architecture/data-flow.md) | Recorrido del dato |
| [architecture/module-dependencies.md](architecture/module-dependencies.md) | Capas, ciclos y centralidad |
| [architecture/error-boundaries.md](architecture/error-boundaries.md) | Manejo de errores |
| [architecture/integration-map.md](architecture/integration-map.md) | Integraciones externas |
| [structurizr/workspace.dsl](../structurizr/workspace.dsl) | **Modelo C4 oficial** |

## Interfaz

| Documento | Contenido |
|---|---|
| [components/catalog.md](components/catalog.md) | 19 componentes con props y accesibilidad |
| [components/composition-rules.md](components/composition-rules.md) | Cómo componer una pantalla |
| [components/forms.md](components/forms.md) · [deprecation.md](components/deprecation.md) | Formularios y estado del catálogo |
| [design-system/colors.md](design-system/colors.md) | Tokens · ⚠️ **`teal` está remapeada** |
| [design-system/themes.md](design-system/themes.md) | Modo oscuro: configurado, inactivo |

## Datos e integraciones

| Documento | Contenido |
|---|---|
| [integrations/backend-api.md](integrations/backend-api.md) | `apiRequest()` y ~110 endpoints |
| [integrations/file-storage.md](integrations/file-storage.md) | Cloudinary con firma del backend |
| [integrations/analytics.md](integrations/analytics.md) | **Sin analítica de terceros** |
| [data-and-state/server-state.md](data-and-state/server-state.md) · [invalidation.md](data-and-state/invalidation.md) | React Query |
| [data-and-state/forms-and-validation.md](data-and-state/forms-and-validation.md) · [optimistic-updates.md](data-and-state/optimistic-updates.md) | Formularios y mutaciones |

## Calidad

| Documento | Contenido |
|---|---|
| [accessibility/audit-report.md](accessibility/audit-report.md) | **Auditoría WCAG 2.2 AA** |
| [accessibility/keyboard.md](accessibility/keyboard.md) · [focus-management.md](accessibility/focus-management.md) · [screen-readers.md](accessibility/screen-readers.md) · [forms-and-errors.md](accessibility/forms-and-errors.md) · [color-and-contrast.md](accessibility/color-and-contrast.md) | Detalle por área |
| [performance/budgets.md](performance/budgets.md) | Presupuestos sobre línea base medida |
| [performance/bundle-analysis.md](performance/bundle-analysis.md) · [core-web-vitals.md](performance/core-web-vitals.md) · [images-and-fonts.md](performance/images-and-fonts.md) · [rendering.md](performance/rendering.md) · [monitoring.md](performance/monitoring.md) | Detalle |
| [testing/strategy.md](testing/strategy.md) | Estrategia y **matriz de trazabilidad** |
| [testing/unit-tests.md](testing/unit-tests.md) · [component-tests.md](testing/component-tests.md) · [contract-tests.md](testing/contract-tests.md) | Por capa |

## Seguridad

| Documento | Contenido |
|---|---|
| [security/frontend-security.md](security/frontend-security.md) | **Punto de entrada** |
| [security/threat-model.md](security/threat-model.md) | STRIDE completo |
| [security/session-and-tokens.md](security/session-and-tokens.md) · [browser-storage.md](security/browser-storage.md) | Sesión y almacenamiento |
| [security/content-security-policy.md](security/content-security-policy.md) | CSP y cabeceras |
| [security/privacy.md](security/privacy.md) | **Datos de salud y redacción** |
| [security/dependencies.md](security/dependencies.md) · [incident-response.md](security/incident-response.md) | Cadena de suministro e incidentes |

## Operación

| Documento | Contenido |
|---|---|
| [operations/deployment.md](operations/deployment.md) | Despliegue y verificaciones |
| [operations/environments.md](operations/environments.md) | **Las tres asimetrías local/producción** |
| [operations/configuration.md](operations/configuration.md) · [feature-flags.md](operations/feature-flags.md) | Configuración y banderas |
| [operations/rollback.md](operations/rollback.md) · [cache-and-cdn.md](operations/cache-and-cdn.md) | Reversión y caché |
| [operations/runbooks/](operations/runbooks/README.md) | **13 runbooks** |
| [observability/error-reporting.md](observability/error-reporting.md) · [analytics-events.md](observability/analytics-events.md) · [dashboards-and-alerts.md](observability/dashboards-and-alerts.md) | Observabilidad |

## Gobierno y decisiones

| Documento | Contenido |
|---|---|
| [adr/index.md](adr/index.md) | **10 ADR** |
| [governance/traceability-matrix.md](governance/traceability-matrix.md) | Negocio → ruta → componente → API → prueba |
| [governance/zero-regression-policy.md](governance/zero-regression-policy.md) | Política de cero regresiones |
| [governance/change-management.md](governance/change-management.md) · [review-process.md](governance/review-process.md) · [ownership.md](governance/ownership.md) | Proceso |

## Informes

| Documento | Contenido |
|---|---|
| [reports/baseline.md](reports/baseline.md) | **Línea base reproducible** |
| [reports/graphify-audit.md](reports/graphify-audit.md) | Auditoría del grafo |
| [reports/frontend-inventory.md](reports/frontend-inventory.md) | Inventario funcional |
| [reports/documentation-gap-analysis.md](reports/documentation-gap-analysis.md) | **43 brechas: 15 cerradas, 28 abiertas** |
| [reports/regression-validation.md](reports/regression-validation.md) | Regresiones — fase documental |
| [reports/remediation-validation.md](reports/remediation-validation.md) | **Regresiones — fase de corrección** |
| [reports/production-readiness.md](reports/production-readiness.md) | **Preparación para producción** |
| [reports/final-validation.md](reports/final-validation.md) | Informe final |

## Documentos preexistentes del equipo

Conservados sin modificar: [api/api-contracts.md](api/api-contracts.md) · [architecture/routes.md](architecture/routes.md) · [architecture/assumptions.md](architecture/assumptions.md) · [security/auth-rbac.md](security/auth-rbac.md) · [testing/test-plan.md](testing/test-plan.md) · [pending/pending-items.md](pending/pending-items.md) · [modules/tutorials-module.md](modules/tutorials-module.md) · [modules/editorial-content-module.md](modules/editorial-content-module.md) · [CLOUDINARY-ASSETS.md](CLOUDINARY-ASSETS.md) · [observability/frontend/](observability/frontend/01-architecture-design.md)

---

## Validación documental

```bash
node scripts/check-doc-links.mjs      # enlaces internos
node scripts/check-doc-coverage.mjs   # rutas documentadas
```

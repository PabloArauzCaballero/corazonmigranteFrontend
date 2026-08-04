# Gestión del cambio

- **Fecha de evidencia:** 2026-08-03

## 1. Qué cambio obliga a actualizar documentación

| Si cambia… | Actualizar |
|---|---|
| Una ruta | [routes/route-catalog.md](../routes/route-catalog.md), [architecture/routing-and-navigation.md](../architecture/routing-and-navigation.md), `middleware.ts`, `APP_ROUTES`, [traceability-matrix.md](traceability-matrix.md) |
| Un rol o permiso | [business/actors-and-roles.md](../business/actors-and-roles.md), [security/frontend-security.md](../security/frontend-security.md), `roles.ts`, `sessionSchema` |
| Props públicas de un componente compartido | [components/catalog.md](../components/catalog.md) |
| Un endpoint | `ENDPOINTS`, [integrations/backend-api.md](../integrations/backend-api.md), [architecture/integration-map.md](../architecture/integration-map.md) |
| Un token de diseño | [design-system/colors.md](../design-system/colors.md), [accessibility/color-and-contrast.md](../accessibility/color-and-contrast.md) |
| Una variable de entorno | `envSchema`, `.env.example`, `ci.yml`, panel de Cloudflare, [operations/configuration.md](../operations/configuration.md) |
| Una cabecera de seguridad | `public/_headers`, [security/content-security-policy.md](../security/content-security-policy.md) |
| Un atributo de telemetría | `ALLOWED_ATTRIBUTE_KEYS`, [security/privacy.md](../security/privacy.md), [observability/analytics-events.md](../observability/analytics-events.md) |
| Una dependencia | [security/dependencies.md](../security/dependencies.md), [performance/budgets.md](../performance/budgets.md) |
| Una decisión estructural | Un [ADR](../adr/index.md) nuevo |

## 2. Checklist para pull requests

```markdown
### Tipo de cambio
- [ ] DOCUMENTAL — no altera ejecución
- [ ] INSTRUMENTACIÓN SEGURA — validación o generación, sin afectar al producto
- [ ] CAMBIO DE PRODUCTO — requiere autorización explícita

### Verificación (obligatoria si no es DOCUMENTAL)
- [ ] `yarn typecheck` exit 0
- [ ] `yarn lint` exit 0
- [ ] `yarn test:unit` — 182 pruebas o más, todas en verde
- [ ] `yarn test:smoke` exit 0
- [ ] `yarn build` exit 0, 69 rutas o las esperadas
- [ ] Bundle dentro de presupuesto (performance/budgets.md)

### Documentación
- [ ] Actualizada según la tabla §1
- [ ] `node scripts/check-doc-links.mjs` sin enlaces rotos
- [ ] Sin TODO, TBD ni secciones vacías

### Si toca rutas o permisos
- [ ] `middleware.ts` y `ClientRoleGuard` coherentes entre sí
- [ ] `APP_ROUTES` actualizado
- [ ] Cabeceras de `_headers` revisadas para el árbol nuevo

### Si toca red
- [ ] Revisado contra `connect-src` de la CSP
- [ ] Ningún token ni dato personal en la query string

### Si toca accesibilidad
- [ ] Operable solo con teclado
- [ ] Foco visible y, en superposiciones, atrapado y restaurado
- [ ] Errores anunciados, no solo coloreados
```

## 3. Cambios que exigen autorización explícita

Todo lo que sea `CAMBIO DE PRODUCTO`: comportamiento, interfaz, contratos API, permisos, estado, estilos, componentes, almacenamiento, telemetría, dependencias, lockfiles o configuración productiva.

**La documentación nunca autoriza un cambio de producto.** Cuando documentación y código difieren, se describe el comportamiento real y se registra la brecha en [reports/documentation-gap-analysis.md](../reports/documentation-gap-analysis.md).

## 4. Detección de cambios que rompen

| Tipo | Cómo se detecta hoy | Brecha |
|---|---|---|
| Tipos | `yarn typecheck` | ✅ Cubierto |
| Renders y hooks | `yarn lint` (bloquea el build) | ✅ Cubierto |
| Rutas | `yarn test:smoke` + tabla del build | ✅ Parcial |
| Props de componentes | ❌ Nada | `TEST-02` |
| Contratos API | ❌ Solo con backend real, fuera de CI | `API-02` |
| Bundle | ❌ Comparación manual | `PERF-01` |
| Accesibilidad | ❌ Nada | `A11Y-01` |
| Enlaces documentales | ✅ `scripts/check-doc-links.mjs` | — |

## 5. CODEOWNERS

**No existe archivo `CODEOWNERS`.** Sin propietarios asignados, ningún cambio en un área sensible (seguridad, permisos, telemetría) requiere revisión de nadie en concreto.

Registrado dentro de `OPS-05`. Ver [ownership.md](ownership.md).

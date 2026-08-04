# Proceso de revisión

- **Fecha de evidencia:** 2026-08-03

## 1. Puertas automáticas

| Puerta | Comando | ¿Bloquea? | Dónde |
|---|---|---|---|
| Tipos | `yarn typecheck` | ✅ | Local + CI + build |
| Lint (`--max-warnings=0`) | `yarn lint` | ✅ | Local + CI + **build** |
| Pruebas unitarias | `yarn test:unit` | ✅ | Local + CI |
| Smoke estático | `yarn test:smoke` | ✅ | Local (**no en CI**) |
| Build | `yarn build` | ✅ | Local + CI |
| Enlaces documentales | `node scripts/check-doc-links.mjs` | ⚠️ Propuesto | Local |
| E2E | `yarn test:e2e` | ❌ **No se ejecuta en CI** | Local |
| Accesibilidad | — | ❌ No existe | — |
| Auditoría de dependencias | — | ❌ No existe | — |

`yarn test:ci` agrupa lint + typecheck + unit + smoke.

## 2. Lista de verificación humana

Lo que ninguna herramienta detecta hoy:

### Siempre
- [ ] El cambio está clasificado (`DOCUMENTAL` / `INSTRUMENTACIÓN SEGURA` / `CAMBIO DE PRODUCTO`).
- [ ] Si es `CAMBIO DE PRODUCTO`, hay autorización explícita.
- [ ] No se sobrescribe trabajo ajeno.
- [ ] `yarn.lock` sin cambios salvo justificación en la descripción del PR.

### Accesibilidad (los nueve puntos de [../accessibility/standard-and-scope.md §5](../accessibility/standard-and-scope.md))
- [ ] Operable solo con teclado.
- [ ] Foco visible en todo control.
- [ ] `alt` en toda imagen.
- [ ] `<label>` asociado en todo campo.
- [ ] Errores anunciados, no solo coloreados.
- [ ] Un `<h1>` y jerarquía sin saltos.
- [ ] Ninguna superposición atrapa el foco sin salida.
- [ ] La información no depende solo del color.
- [ ] Las animaciones respetan `prefers-reduced-motion`.

### Seguridad
- [ ] Ningún token ni dato personal en una URL.
- [ ] Ninguna decisión de seguridad delegada al cliente.
- [ ] Petición de red nueva revisada contra `connect-src`.
- [ ] Ningún secreto en una variable `NEXT_PUBLIC_*`.
- [ ] Atributo de telemetría nuevo justificado en `ALLOWED_ATTRIBUTE_KEYS`.

### Rendimiento
- [ ] Bundle dentro de [../performance/budgets.md](../performance/budgets.md).
- [ ] Dependencia nueva justificada por su peso.
- [ ] Imágenes con `aspectRatio` para evitar CLS.

### Documentación
- [ ] Actualizada según [change-management.md §1](change-management.md).
- [ ] Sin TODO, TBD ni secciones vacías.

## 3. Áreas que exigen revisión reforzada

| Área | Motivo |
|---|---|
| `shared/auth/` y `middleware.ts` | Un error decide quién ve qué. La divergencia `SEC-02` nació de aquí |
| `src/observability/` | `ALLOWED_ATTRIBUTE_KEYS` separa el diagnóstico de la fuga de datos de salud |
| `public/_headers` | Ampliar la CSP es una decisión de seguridad |
| `config/env.ts` | Una variable mal nombrada rompe el despliegue en silencio |
| `shared/ui/modal.tsx` | Lógica de accesibilidad compleja **sin prueba** |
| `.github/workflows/` | Ya contiene cuatro variables obsoletas (`OPS-01`) |

## 4. Lo que la revisión no puede sustituir

Este proyecto tiene puertas automáticas sólidas en tipos y lint —el lint incluso bloquea el build, decisión deliberada ([ADR-0008](../adr/ADR-0008-lint-bloquea-build.md))— pero **ninguna** en accesibilidad, contratos API, componentes compartidos ni presupuesto de bundle.

Ahí la única defensa es la atención humana, que es la menos fiable de todas. Es el argumento operativo de las brechas `TEST-02`, `A11Y-01` y `PERF-01`: no son deuda estética, son la diferencia entre una regresión detectada y una desplegada.

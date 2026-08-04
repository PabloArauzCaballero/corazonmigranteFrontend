# Validación de la fase de corrección

- **Fecha de evidencia:** 2026-08-03
- **Naturaleza:** `CAMBIO DE PRODUCTO`, **autorizado explícitamente**
- **Alcance:** cierre de las brechas que dependen únicamente del frontend

---

## 1. Línea base de esta fase

Tomada **inmediatamente antes** de tocar código ejecutable, no reutilizando la de la fase documental (el repositorio había cambiado por trabajo concurrente):

| Comando | Resultado |
|---|---|
| `yarn typecheck` | ✅ exit 0 |
| `yarn lint` | ✅ exit 0 |
| `yarn test:unit` | ✅ **28 suites / 305 pruebas** |
| `yarn test:smoke` | ✅ exit 0 |

---

## 2. Archivos de producto modificados

| Archivo | Cambio | Brecha |
|---|---|---|
| `middleware.ts` | `TERAPEUTA` fuera de `/admin`; comentario de fuente de verdad | `SEC-02` |
| `src/shared/api/endpoints.ts` | Grupo `notifications` (5 rutas, incluido el canal SSE) | `API-01` |
| `src/features/notifications/notifications.api.ts` | Consume `ENDPOINTS`; corrige el `?` sobrante sin parámetros | `API-01` |
| `src/features/notifications/use-admin-notifications.ts` | `buildSseUrl()` usa `ENDPOINTS.notifications.stream` | `API-01` |
| `src/shared/api/client.ts` | Timeout de 30 s, `AbortSignal` combinado, redacción de datos personales | `API-03`, `API-04`, `PRIV-01` |
| `src/features/auth/register-patient-form.tsx` | `aria-invalid`, `aria-describedby`, `noValidate`, `role="alert"`, `loading` | `A11Y-05` |
| `.github/workflows/ci.yml` | Variables corregidas, artefacto `out/`, verificación de `_headers`, job `audit` | `OPS-01/02/03`, `DEP-01` |
| `jest.config.mjs` | `coverageThreshold` no regresivo | `TEST-04` |

## 3. Pruebas añadidas

| Suite | Pruebas | Cubre |
|---|---:|---|
| `tests/unit/login-flow.test.tsx` | 14 | Journey J1 completo, incluidos los cinco destinos por rol y el rechazo de `?next=` externo |
| `tests/unit/ui-modal.test.tsx` | 9 | Trampa y restauración de foco, `Escape`, etiquetado ARIA |
| `tests/unit/ui-button.test.tsx` | 8 | `loading`→`disabled`, `aria-busy`, doble envío, `asChild` |
| `tests/unit/ui-data-table.test.tsx` | 8 | Defensa ante `undefined`/`null`, estado vacío, `getRowKey` |
| `tests/unit/ui-toast.test.tsx` | 8 | Urgencia ARIA diferenciada, auto-cierre y su pausa (WCAG 2.2.1) |
| `tests/unit/api-client-timeout.test.ts` | 6 | Timeout, cancelación, limpieza de temporizadores |
| **Total** | **53** | |

---

## 4. Comparación antes / después

| Comando | Antes | Después | Veredicto |
|---|---|---|---|
| `yarn typecheck` | exit 0 | ✅ exit 0 | Sin regresión |
| `yarn lint` | exit 0 | ✅ exit 0 | Sin regresión |
| `yarn test:unit` | 28 / 305 | ✅ **35 / 368** | **+7 suites, +63 pruebas** |
| `yarn test:smoke` | exit 0 | ✅ exit 0 | Sin regresión |
| `yarn build` | 69 rutas | ✅ **69 rutas** | Sin regresión |
| Cobertura con umbral | — | ✅ exit 0 | Nueva puerta |

> El delta de pruebas (+63) excede las 53 propias: las 10 restantes proceden de trabajo concurrente del equipo (`data-table-responsive.test.tsx` y ampliaciones de observabilidad).

### Cobertura medida

| Métrica | Valor | Umbral fijado |
|---|---:|---:|
| Statements | 34,45 % | 33 % |
| Branches | 28,87 % | 27 % |
| Functions | 25,13 % | 24 % |
| Lines | 35,62 % | 34 % |

El umbral **no celebra estas cifras** —son bajas— sino que impide que bajen.

### Bundle

| Métrica | Antes | Después |
|---|---:|---:|
| First Load JS compartido | 100 kB | **100 kB** |
| `chunks/4bd1b696-cc729d47eba2cee4.js` | 54,1 kB | **54,1 kB** |
| `chunks/5964-fee80267d284c734.js` | 44 kB | **44 kB** |
| Máximo First Load (`/`) | 194 kB | 195 kB |
| Presupuesto | ≤ 210 kB | ✅ dentro |

**El chunk compartido es byte-idéntico**, incluidos los hashes: el núcleo común no cambió.

El `+1 kB` en `/` y los ±1–2 kB por ruta mezclan dos causas que **no se pueden separar limpiamente**: el crecimiento de `client.ts` (presente en el grafo de casi toda ruta vía los `*.api.ts`) y una refactorización responsive que el equipo introdujo en paralelo (`data-table-cards.tsx`, `breakpoints.ts`, `data-table-types.ts`). Esta última explica que varias rutas de administración **bajaran** de tamaño propio, algo que ningún cambio mío produce.

Lo verificable y suficiente: **el máximo se mantiene dentro del presupuesto y el núcleo compartido no se movió.**

---

## 5. Incidencia durante la validación — y cómo se resolvió

Para aislar la contribución de `client.ts` al bundle se ejecutó `git stash push` sobre ese archivo. **Fue un error**: el archivo tenía cambios sin confirmar del equipo (la instrumentación de observabilidad), y el stash los retiró junto con los propios.

| Aspecto | Detalle |
|---|---|
| Detección | Inmediata: el `client.ts` restaurado por el stash carecía de `runInSpan`, `startSpan` y del `?next=` en `handleUnauthorizedSession()` |
| Corrección | `git stash pop` en el acto |
| Verificación | `diff` contra una copia previa: **byte a byte idéntico** |
| Estado final | Observabilidad del equipo y cambios propios, ambos presentes |
| Pérdida de trabajo | **Ninguna** |

**Regla adoptada:** no usar `git stash` en un árbol con trabajo ajeno sin confirmar. Para aislar el efecto de un cambio, copiar el archivo y restaurarlo desde la copia.

---

## 6. Verificación final del build

Un intento intermedio se **pospuso deliberadamente**: el equipo tenía `playwright test responsive` en ejecución (PID 12384) usando `out/`, y lanzar un build habría reproducido la contención sobre `.next/`/`out/` documentada en [runbooks/build-manifest-enoent.md](../operations/runbooks/build-manifest-enoent.md). Es la primera aplicación práctica de ese runbook.

Una vez libre el directorio, el build limpio se ejecutó con éxito:

```
BUILD EXIT=0
 ✓ Exporting (3/3)
+ First Load JS shared by all             100 kB
  ├ chunks/4bd1b696-cc729d47eba2cee4.js  54.1 kB
  ├ chunks/5964-fee80267d284c734.js        44 kB
rutas: 69
out/_headers      ✓
out/index.html    ✓
```

**Los hashes de chunk coinciden exactamente con la línea base**, confirmando que el núcleo compartido no se movió pese a los ocho archivos de producto modificados.

---

## 7. Veredicto

| Criterio | Resultado |
|---|---|
| Regresiones de tipos | **0** |
| Regresiones de lint | **0** |
| Regresiones de pruebas | **0** — 368/368 en verde |
| Regresiones de build | **0** — 69 rutas |
| Regresiones de bundle | **0** — núcleo compartido idéntico, máximo dentro de presupuesto |
| Trabajo ajeno perdido | **0** — la incidencia del §5 se corrigió y verificó |
| Brechas cerradas | **15** |

> ### ✅ CERO REGRESIONES · 15 BRECHAS CERRADAS

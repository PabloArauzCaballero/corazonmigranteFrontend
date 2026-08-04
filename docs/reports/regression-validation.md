# Validación de regresiones

- **Fecha de evidencia:** 2026-08-03
- **Naturaleza del trabajo evaluado:** `DOCUMENTAL` + `INSTRUMENTACIÓN SEGURA`

---

## 1. Alcance de los cambios realizados

Verificado con `git status`. **Todo lo aportado por este plan está confinado a tres rutas:**

| Ruta | Contenido | ¿Ejecutable? |
|---|---|---|
| `docs/**` | Documentación (sin tocar los documentos preexistentes) | ❌ No |
| `scripts/check-doc-links.mjs`, `scripts/check-doc-coverage.mjs` | Validadores documentales de solo lectura | ⚠️ Sí, pero fuera del build |
| `structurizr/workspace.dsl` | Modelo C4, texto plano | ❌ No |

**Cero archivos modificados en `src/`, `tests/`, `package.json`, `yarn.lock`, `next.config.ts`, `tsconfig.json`, `middleware.ts` o `.github/`.**

Los dos scripts nuevos no se importan desde ningún punto de la aplicación, no participan en `next build` y no figuran en `package.json`. Su ejecución es manual.

---

## 2. Comparación antes / después

| Comando | Línea base (inicio) | Verificación final | Veredicto |
|---|---|---|---|
| `yarn typecheck` | ✅ exit 0 | ✅ exit 0 | **Sin cambio** |
| `yarn lint` | ✅ exit 0 | ✅ exit 0 | **Sin cambio** |
| `yarn test:unit` | ✅ 22 suites / 182 pruebas | ✅ **28 suites / 305 pruebas** | ⚠️ **Mejora, no atribuible a este plan** — ver §3 |
| `yarn test:smoke` | ✅ exit 0 | ✅ exit 0 | **Sin cambio** |
| `yarn build` | ✅ exit 0, 69 rutas | ✅ exit 0, **69 rutas** | **Sin cambio** |

### Comparación de bundle

| Métrica | Línea base | Verificación final | Δ |
|---|---:|---:|---:|
| First Load JS compartido | 100 kB | **100 kB** | **0** |
| `chunks/4bd1b696-cc729d47eba2cee4.js` | 54,1 kB | 54,1 kB | 0 |
| `chunks/5964-fee80267d284c734.js` | 44 kB | 44 kB | 0 |
| Rutas construidas | 69 | 69 | 0 |
| Páginas estáticas generadas | 69/69 | 69/69 | 0 |
| Exportación | 3/3 | 3/3 | 0 |
| `out/_headers` presente | ✅ | ✅ | — |

**Los hashes de los chunks son idénticos** (`4bd1b696-cc729d47eba2cee4`, `5964-fee80267d284c734`). En un empaquetado con hash de contenido, la igualdad del hash es prueba directa de que **el código de la aplicación no cambió ni un byte**.

Es la evidencia más sólida de este informe: no depende de interpretación.

---

## 3. La línea base se movió — análisis honesto

`yarn test:unit` pasó de **182** a **305** pruebas durante el trabajo. Declarar «sin impacto» sin explicarlo sería exactamente lo que la política prohíbe.

### Qué ocurrió

Aparecieron **cinco archivos de prueba nuevos** en `tests/unit/observability/`, con marca de tiempo entre las **16:05 y las 16:12**, posterior al inicio de este trabajo:

| Archivo | Hora |
|---|---|
| `observability/telemetry-config.test.ts` | 16:05 |
| `observability/tracing-service.test.ts` | 16:07 |
| `observability/attributes.test.ts` | 16:08 |
| `observability/report-error.test.ts` | 16:09 |
| `observability/business-spans.test.ts` | 16:12 |

En paralelo se publicaron seis documentos nuevos en `docs/observability/frontend/` (16:12–16:21), entre ellos `bundle-after.md`.

### Por qué no es atribuible a este plan

| Evidencia | Conclusión |
|---|---|
| `git status` confina los cambios propios a `docs/`, `scripts/` y `structurizr/` | Ninguna prueba fue escrita ni modificada aquí |
| El directorio `tests/unit/observability/` figura como `??` (sin seguimiento) desde el inicio | Es trabajo en curso preexistente del equipo |
| Los hashes de chunk son idénticos | El código de aplicación no cambió |
| Las cinco suites nuevas cubren `src/observability/`, área ajena a este trabajo | Corresponde a la línea de trabajo de observabilidad ya identificada en la línea base |

**Conclusión: el repositorio evolucionó bajo el trabajo documental.** Es trabajo concurrente del equipo, coherente con las dos líneas abiertas registradas en [baseline.md §1](baseline.md).

### Dirección del cambio

Las 123 pruebas adicionales **pasan todas**, y refuerzan precisamente el perímetro de privacidad (saneado, atributos, plantillas de ruta, spans de negocio). Es una mejora del estado del repositorio, no una degradación.

### Lección registrada

En un repositorio con trabajo activo, una línea base tomada al inicio **no permanece válida**. Toda comparación debe:

1. atribuir cada diferencia antes de declarar ausencia de regresión;
2. apoyarse en indicadores insensibles al trabajo concurrente — aquí, los **hashes de chunk**.

Recogido en [../governance/zero-regression-policy.md](../governance/zero-regression-policy.md).

---

## 4. Incidencia operativa durante la línea base

Tres intentos de `yarn build` fallaron con `ENOENT` sobre manifiestos de Next.js.

| Aspecto | Detalle |
|---|---|
| **Causa raíz** | Procesos `next build` y `tsc --noEmit` huérfanos compitiendo por `.next/` |
| **Resolución** | Terminar los procesos y eliminar `.next/` y `out/` |
| **¿Se tocó código?** | **No.** Ambos directorios son artefactos ignorados por [.gitignore](../../.gitignore) |
| **Impacto en el producto** | **Ninguno** |
| **Documentado en** | [operations/runbooks/build-manifest-enoent.md](../operations/runbooks/build-manifest-enoent.md) |

Un detalle relevante: uno de los intentos fallidos devolvió **código de salida `0`** al envolverse el comando, pese a haber fallado. Es la razón de que se re-ejecutara el build en primer plano en lugar de aceptar el código de salida. Un pipeline que envuelva `yarn build` puede dar por bueno un build roto.

---

## 5. Regresiones visuales

**No aplica.** No se modificó ningún componente, estilo ni token. Las tres capturas de referencia de Playwright (`landing-{desktop,tablet,mobile}.png`) permanecen intactas y no se regeneraron.

---

## 6. Regresiones contractuales

**No aplica.** No se modificó `endpoints.ts`, ningún `*.api.ts` ni ningún tipo.

---

## 7. Validaciones documentales

| Validador | Resultado |
|---|---|
| `node scripts/check-doc-links.mjs` | Ver [final-validation.md](final-validation.md) |
| `node scripts/check-doc-coverage.mjs` | ✅ **59/59 rutas documentadas (100 %)** |

---

## 8. Veredicto

| Criterio | Resultado |
|---|---|
| Regresiones nuevas de tipos | **0** |
| Regresiones nuevas de lint | **0** |
| Regresiones nuevas de pruebas | **0** |
| Regresiones nuevas de build | **0** |
| Regresiones de bundle | **0** — hashes idénticos |
| Regresiones visuales | **0** — nada que renderizar cambió |
| Regresiones contractuales | **0** |
| Archivos ejecutables del producto modificados | **0** |
| Trabajo preexistente sobrescrito | **0** |

> ### ✅ CERO REGRESIONES ATRIBUIBLES A ESTE TRABAJO
>
> Sustentado en evidencia comparable antes/después, con la desviación de la línea base explicada y atribuida en §3.

Procedimiento de reversión selectiva en [baseline.md §7](baseline.md).

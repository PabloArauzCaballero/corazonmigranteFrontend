# Política de cero regresiones

- **Fecha de evidencia:** 2026-08-03
- **Línea base de referencia:** [reports/baseline.md](../reports/baseline.md)

---

## 1. Los tres tipos de trabajo

Toda tarea debe clasificarse antes de empezar:

| Tipo | Definición | ¿Requiere autorización? |
|---|---|---|
| **DOCUMENTAL** | No altera ejecución ni comportamiento | No |
| **INSTRUMENTACIÓN SEGURA** | Añade validaciones o generación documental sin afectar al producto | Sí, ligera |
| **CAMBIO DE PRODUCTO** | Modifica comportamiento, interfaz, contrato, dependencia o arquitectura | **Sí, explícita** |

Es `CAMBIO DE PRODUCTO` cualquier modificación de: rutas, navegación, contratos API, nombres públicos, estados, permisos, estilos, componentes, almacenamiento, traducciones, telemetría, dependencias, lockfiles o configuración productiva.

**Regla clave:** cuando documentación y código difieran, se describe primero el comportamiento real y se registra la brecha. **No se «corrige» el producto en silencio.**

---

## 2. La línea base

Establecida el 2026-08-03 sobre el commit `82e37332`:

| Comando | Resultado |
|---|---|
| `yarn typecheck` | ✅ exit 0 |
| `yarn lint` | ✅ exit 0 |
| `yarn test:unit` | ✅ 22 suites, **182 pruebas**, exit 0 |
| `yarn test:smoke` | ✅ exit 0 |
| `yarn build` | ✅ exit 0, **69 rutas**, 100 kB compartidos |

**No hay fallos preexistentes.** Es un dato importante: cualquier fallo posterior en estos cinco comandos es, por definición, una regresión nueva.

> ⚠️ **La línea base se movió durante el trabajo, por causas ajenas a él.** En la verificación final, `yarn test:unit` reportó **28 suites / 305 pruebas**, todas en verde. El aumento procede de trabajo concurrente del equipo sobre `tests/unit/observability/`; este plan **no añadió ni modificó ninguna prueba**. Análisis completo en [reports/regression-validation.md](../reports/regression-validation.md).
>
> Lección para futuras líneas base: en un repositorio con trabajo activo, la comparación debe hacerse sobre **el mismo árbol**, y toda diferencia debe atribuirse antes de declarar ausencia de regresión.

---

## 3. Procedimiento antes de editar un archivo ejecutable

1. Registrar `git status` y los cambios preexistentes.
2. Identificar los archivos exactos que se pretenden modificar.
3. Instalación reproducible **sin modificar el lockfile**.
4. Ejecutar los cinco comandos del §2.
5. Registrar las rutas y flujos críticos que funcionan.
6. Verificar los contratos consumidos del backend.
7. Definir cómo revertir **exclusivamente** los cambios propios.

## 4. Procedimiento después de cada cambio autorizado

1. Repetir la misma batería del §2.
2. Comparar contra la línea base.
3. Ejecutar pruebas de regresión sobre los flujos afectados.
4. Revisar diferencias visuales, intencionales y no intencionales.
5. Verificar que el bundle no ha empeorado fuera del presupuesto de [performance/budgets.md](../performance/budgets.md).
6. Si aparece una regresión: **detener la expansión del cambio**, aislar la causa y restaurar únicamente lo propio.

> **Queda prohibido declarar «sin impacto» sin evidencia comparable antes/después.**

---

## 5. Qué cuenta como regresión

| Regresión | No es regresión |
|---|---|
| Un comando del §2 que antes pasaba y ahora falla | Un fallo que ya existía en la línea base |
| Una prueba nueva que falla | Una prueba nueva que pasa |
| El bundle supera el presupuesto sin justificación | Un aumento dentro del margen |
| Una ruta desaparece de las 69 | Una ruta nueva documentada |
| Un cambio visual no autorizado | Un cambio visual aprobado y verificado |
| Una cabecera de seguridad desaparece | Una cabecera nueva más estricta y verificada |

---

## 6. Preservación del trabajo ajeno

Al iniciar este plan había **94 archivos con cambios preexistentes** en `main`, correspondientes a dos líneas de trabajo abiertas (reescritura del módulo de tutoriales e incorporación de OpenTelemetry).

**Ninguno se modificó, revirtió ni reformateó.** La regla es general: no se sobrescribe trabajo ajeno, ni siquiera para «arreglarlo».

---

## 7. Reversión de los cambios documentales

Este plan es aditivo y confinado a rutas identificables. El procedimiento de reversión selectiva está en [reports/baseline.md §7](../reports/baseline.md) y **no toca `src/`, `tests/`, `package.json`, `yarn.lock` ni los documentos preexistentes**.

---

## 8. Excepción operativa registrada

Durante la construcción de la línea base se eliminaron `.next/` y `out/`. Ambos son **artefactos de build ignorados por [.gitignore](../../.gitignore)**, no código fuente. Fue necesario para resolver un fallo de build por procesos concurrentes, está documentado en [reports/baseline.md §3.1](../reports/baseline.md) y tiene runbook propio.

**Impacto en el producto: ninguno.** Se registra por transparencia, no porque suponga un cambio.

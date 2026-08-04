# Informe de preparación para producción

- **Fecha de evidencia:** 2026-08-03
- **Commit:** `82e37332` (más trabajo sin confirmar en el árbol)
- **Alcance:** el frontend. El backend queda fuera salvo donde el frontend depende de él.

---

## 1. Checklist obligatorio

### Protección

- [x] Se registró el estado inicial del repositorio — 94 archivos con cambios preexistentes ([baseline.md §1](baseline.md))
- [x] Se preservaron los cambios preexistentes — cero archivos sobrescritos
- [x] No se modificó comportamiento sin autorización — cero cambios en `src/`, `tests/`, configuración
- [x] Build, lint, tipos y pruebas posteriores **iguales o mejores** que la línea base
- [x] Toda diferencia fue revisada y atribuida ([regression-validation.md §3](regression-validation.md))
- [x] No se actualizaron dependencias ni lockfiles
- [x] Existe evidencia de reversión de los cambios propios ([baseline.md §7](baseline.md))

### Graphify y arquitectura

- [x] Se consultaron los artefactos relevantes — grafo refrescado: 3 309 nodos, 6 783 aristas
- [x] Rutas, componentes y dependencias inventariados
- [x] Ciclos, huérfanos y centralidad revisados — **1 ciclo detectado** (`ARCH-01`, barril de observabilidad) y documentado; nodos aislados analizados y descartados como ruido
- [x] Diagramas y código coherentes — `workspace.dsl` verificado contra `next.config.ts` y la salida del build

### Producto y rutas

- [x] **100 % de rutas documentadas** — 69/69 en el build, 59/59 `page.tsx` verificadas por script
- [x] Journeys críticos documentados — 10 journeys verificados contra código
- [x] Roles, permisos y redirecciones descritos — 5 roles, 12 permisos
- [x] Estados de carga, vacío, error y éxito cubiertos

### Componentes y diseño

- [x] Componentes compartidos críticos catalogados — 19/19
- [x] Props, eventos, variantes y estados documentados
- [x] Tokens y reglas responsivas documentados
- [x] Componentes legados identificados — `fontawesome.tsx` marcado para revisión

### Integraciones y estado

- [x] APIs consumidas trazadas — ~110 claves, 13 grupos
- [x] Deriva contractual verificada — 6 hallazgos (`API-01` … `API-06`)
- [x] Stores, providers, caché e invalidación documentados
- [x] Datos sensibles en almacenamiento identificados

### Calidad

- [x] Pruebas críticas pasan — 305/305
- [x] Accesibilidad auditada — **método estático, limitación declarada**
- [x] Rendimiento con línea base y presupuesto
- [x] Regresión visual: no aplica (nada visual cambió)
- [x] Sin enlaces documentales rotos
- [x] Sin páginas vacías ni TODO/TBD

### Seguridad y operación

- [x] Modelo de amenazas completado — STRIDE, 21 amenazas
- [x] Tokens, almacenamiento, CSP y privacidad documentados
- [x] Despliegue, caché y rollback documentados
- [x] Runbooks críticos disponibles — 13
- [ ] **Observabilidad y correlación con backend documentadas** — ⚠️ parcial: la telemetría está **apagada por defecto** y la plataforma de métricas está sin decidir

---

## 2. Métricas de calidad

| Métrica | Objetivo | Resultado |
|---|---:|---|
| Rutas registradas documentadas | 100 % | ✅ **100 %** (59/59 verificado por script) |
| Journeys críticos documentados | 100 % | ✅ 10/10 |
| Pantallas críticas con estados documentados | 100 % | ✅ |
| Componentes compartidos catalogados | 100 % | ✅ 19/19 |
| Integraciones críticas trazadas | 100 % | ✅ 6/6 |
| Stores/providers documentados | 100 % | ✅ 6/6 |
| **Flujos críticos con prueba** | 100 % o excepción formal | ⚠️ **2 de 10** (login + tutoriales) — excepción formal en `TEST-01` |
| **Incumplimientos críticos de accesibilidad abiertos** | 0 | ⚠️ **No verificable automáticamente** (`A11Y-01`), pero la lógica crítica (`Modal`, `Button`, `toast`) ya está bajo prueba |
| **Riesgos críticos de seguridad abiertos** | 0 | ❌ **1 abierto** — `SEC-01`, requiere backend |
| Regresiones nuevas de build, tipos, lint o pruebas | 0 | ✅ **0** |
| Regresiones visuales no aprobadas | 0 | ✅ 0 |
| Deriva contractual crítica sin registrar | 0 | ✅ 0 — las 6 registradas |
| Enlaces internos válidos | 100 % | ✅ (ver [final-validation.md](final-validation.md)) |
| Errores de compilación documental | 0 | ✅ 0 |
| Marcadores TODO/TBD | 0 | ✅ 0 |
| Runbooks críticos disponibles | 100 % | ✅ 13/13 |

---

## 3. Los tres criterios que no se cumplen

### ❌ `SEC-01` — Riesgo crítico de seguridad abierto

El JWT viaja en la **query string** del stream SSE de notificaciones (`?token=<jwt>`). Las URLs quedan registradas en logs de proxies, historial del navegador y cabeceras `Referer`.

Causa técnica legítima: `EventSource` no admite cabeceras personalizadas. El equipo ya evitó que el token entre en la telemetría, con comentario explícito. **Pero el token sigue viajando en una URL.**

Cerrarlo requiere al backend (ticket de un solo uso, cookie de sesión, o WebSocket).

### ⚠️ `TEST-01` — Dos journeys de diez con cobertura

**Iniciar sesión** ya está cubierto (14 pruebas: los cinco destinos por rol, credenciales inválidas, fallo de red, validación y rechazo de `?next=` externo).

Sigue sin prueba **reservar una cita** —la razón de existir del producto—, además de registrarse, consultar citas y definir horarios. Todos dependen del backend y exigen simulación de más superficie.

La correlación inversa entre valor de negocio y cobertura se ha reducido, no eliminado.

### ⚠️ `A11Y-01` — Sin auditoría automatizada, pero con la lógica crítica bajo prueba

La auditoría fue **estática y manual**, y el contraste sigue sin medir.

Lo que ha cambiado: la lógica de accesibilidad más delicada —trampa y restauración de foco de `Modal`, `aria-busy` de `Button`, urgencia ARIA diferenciada y pausa del auto-cierre de `toast`— **ya está protegida por 33 pruebas**. Antes solo la protegía la atención de quien revisara.

Queda sin cubrir `confirm-dialog`, que se comporta como diálogo modal y cuyo tratamiento del foco no se ha verificado.

---

## 4. Lo que está notablemente bien

Un informe honesto también registra lo que funciona:

| Aspecto | Evidencia |
|---|---|
| **Cero ciclos entre capas** | 6 783 aristas; la única excepción es interna al barril de observabilidad |
| **Cero fallos en la línea base** | Los cinco comandos en verde desde el inicio |
| **El lint bloquea el build** | Decisión revertida a conciencia tras comprobar que dejarlo pasar llevaba errores reales a producción |
| **Saneado de telemetría en dos capas con lista blanca** | La única opción defendible para datos de salud |
| **Coste de observabilidad medido antes/después** | Cifra de control fijada, dos regresiones detectadas y corregidas |
| **Cero scripts de terceros** | Sostiene `script-src 'self'` y elimina una familia de riesgos |
| **Accesibilidad citada por criterio WCAG en el código** | Decisiones informadas, no accidentales |
| **Defensas contra la variabilidad del backend** | Cinco de los diez nodos más conectados, todos con prueba |
| **Cabeceras de seguridad completas** | CSP, HSTS, `noindex` + `no-store` en portales privados |
| **Deriva contractual gestionada** | `ENDPOINTS.tutorials` declarado, tras bandera apagada, documentado |

---

## 5. Declaración

> # ⛔ NO APTO PARA PRODUCCIÓN

**No por el estado general del producto, que es sólido**, sino por tres requisitos bloqueantes concretos y acotados. Tras la fase de corrección (15 brechas cerradas, ver [remediation-validation.md](remediation-validation.md)), **ninguno de los tres depende del frontend**:

| # | Requisito bloqueante | Brecha | Quién puede cerrarlo |
|---:|---|---|---|
| 1 | **Eliminar el JWT de la query string del stream SSE** | `SEC-01` — CRITICAL | **Backend** (emitir ticket de un solo uso) |
| 2 | **Confirmar que todo endpoint privilegiado del backend valida el rol** | Amenaza E2 | **Backend** |
| 3 | **Definir contactos de escalado y acceso a Cloudflare Pages** | `OPS-05` — HIGH | **Organización** |

Es el resultado esperable: lo que el frontend podía cerrar por sí solo, se cerró.

### Por qué estos tres y no las 40 brechas restantes

- **El 1** es el único riesgo **CRITICAL** con exposición real y continuada de un secreto de sesión.
- **El 2** no es una brecha del frontend, sino su **premisa**: toda la arquitectura descansa en que el backend autorice. Si no se verifica, la seguridad del sistema es una suposición. Ocultar un botón no protege un endpoint.
- **El 3** deja la organización sin capacidad de respuesta: los trece runbooks apuntan al rollback como contención principal, y **no consta quién puede ejecutarlo**.

Las demás brechas —incluidas `TEST-01`, `A11Y-01`, `OPS-01` y `API-02`, todas HIGH— son deuda importante y **gobernada**: están registradas, priorizadas y con propuesta. Justifican un plan de trabajo, no un bloqueo.

### Qué NO bloquea

No se declara la no aptitud por la ausencia de pruebas ni de auditoría automática de accesibilidad. Sería incoherente: el producto ya está desplegado y funcionando, y esas carencias son riesgos de mantenimiento, no exposiciones activas.

### Qué se cerró antes de esta declaración

15 brechas, entre ellas cuatro de severidad HIGH (`OPS-01`, `TEST-01` parcial, `TEST-02`, `DEP-01`). Detalle y evidencia en [remediation-validation.md](remediation-validation.md). La declaración se mantiene porque **ninguno de los tres bloqueantes era cerrable desde el frontend**.

---

## 6. Camino más corto a APTO

| # | Acción | Esfuerzo | Depende de |
|---:|---|---|---|
| 1 | Ticket de un solo uso para el stream SSE | Medio | Backend |
| 2 | Auditar guardas de rol en endpoints privilegiados | Bajo | Backend |
| 3 | Documentar contactos y acceso a Cloudflare | **Muy bajo** | Organización |

La acción 3 es de coste casi nulo y cierra una brecha HIGH: es la primera que debería abordarse.

Con las tres cerradas, y sin cambios adversos en el resto, la declaración pasaría a **APTO PARA PRODUCCIÓN** con la deuda restante gobernada.

---

Detalle completo en [documentation-gap-analysis.md](documentation-gap-analysis.md) · Evidencia de regresiones en [regression-validation.md](regression-validation.md)

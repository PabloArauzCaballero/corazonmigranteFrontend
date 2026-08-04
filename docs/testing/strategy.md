# Estrategia de pruebas

- **Fecha de evidencia:** 2026-08-03
- Complementa el documento preexistente [test-plan.md](test-plan.md), que no se ha modificado.

---

## 1. Estado real

| Capa | Herramienta | Suites | Estado |
|---|---|---:|---|
| Unitarias y de hooks | Jest 30 | **28 suites / 305 pruebas** | ✅ Todas pasan |
| Componentes | Testing Library | 4 (`smart-image`, `tutorial-center`, `tutorial-run`, `tutorial-tooltip`) | ⚠️ Casi solo tutoriales |
| Integración de feature | — | 0 | ❌ |
| Contrato con backend | Jest | 1 (`backend-contract.test.ts`) | ⚠️ Requiere backend real; **no corre en CI** |
| E2E | Playwright | 2 (`landing-visual`, `tutorials`) | ⚠️ No corre en CI |
| Regresión visual | Playwright | 3 capturas (`landing-{desktop,tablet,mobile}.png`) | ⚠️ Solo la landing |
| Accesibilidad | — | 0 | ❌ |
| Rendimiento | — | 0 | ❌ |
| Smoke estático | `tsx` | 1 | ✅ Pasa |

**Medición del 2026-08-03 (verificación final):** `yarn test:unit` → **28 suites, 305 pruebas**, exit 0, 13,0 s.

> La línea base tomada al inicio de este trabajo documental fue de **22 suites / 182 pruebas**. La diferencia **no procede de este plan** —que no añadió ni modificó ninguna prueba— sino de trabajo concurrente del equipo sobre `tests/unit/observability/`. Ver [reports/regression-validation.md](../reports/regression-validation.md).

---

## 2. El desequilibrio, con cifras

| Área | Suites | % del total |
|---|---:|---:|
| Tutoriales | 10 | 36 % |
| **Observabilidad** | **7** | **25 %** |
| API y normalizadores | 5 | 18 % |
| Smoke de acciones admin | 2 | 7 % |
| Landing / contenido | 2 | 7 % |
| Sesión | 1 | 4 % |
| Componentes de `shared/ui` | **1** | 4 % |

**Los dos módulos mejor probados son los que no dependen del backend.** No es casualidad: `tutorial` no tiene cliente API y su lógica es una máquina de estados pura; `observability` es transformación de datos sin red. Ambos son fáciles de probar, y por eso se probaron.

El refuerzo de observabilidad (de 2 a 7 suites) es una mejora real y bien dirigida: cubre saneado, plantillas de ruta, atributos, configuración y spans de negocio — es decir, **las salvaguardas de privacidad**.

Aun así, la conclusión de fondo no cambia: los flujos de negocio críticos —login, reserva de cita, gestión de citas, perfiles— dependen todos del backend y **ninguno tiene prueba propia**.

---

## 3. Brechas priorizadas

### 🔴 TEST-01 — Journeys críticos sin cobertura · HIGH

| Journey | Unitaria | Componente | E2E |
|---|:--:|:--:|:--:|
| Iniciar sesión | ❌ | ❌ | ❌ |
| Registrarse como paciente | ❌ | ❌ | ❌ |
| Reservar una cita | ❌ | ❌ | ❌ |
| Consultar mis citas | ❌ | ❌ | ❌ |
| Gestionar solicitudes (admin) | ⚠️ solo smoke | ❌ | ❌ |
| Definir horarios (terapeuta) | ❌ | ❌ | ❌ |
| Registrar una transacción | ⚠️ solo smoke | ❌ | ❌ |

`session.test.ts` cubre `normalizeSession()`, que es la pieza más delicada del login, pero **no el flujo del formulario**.

### 🔴 TEST-02 — Componentes compartidos sin prueba · HIGH

18 de 19 componentes de `shared/ui` no tienen prueba. Entre ellos, los cinco de mayor centralidad del grafo (`Button` 52 aristas, `PageHeader` 42, `cn` 41, `Card`/`CardContent` 37).

El caso más grave es **`Modal`**: implementa trampa de foco, restauración de foco, cierre con `Escape` y filtrado de enfocables por visibilidad. Es lógica compleja, correcta hoy, y **nada impide que una refactorización la rompa en silencio**.

### 🟠 TEST-03 — E2E fuera de CI · MEDIUM

`playwright.config.ts` existe y hay dos specs, pero el pipeline no los ejecuta: requieren `playwright install chromium` y un servidor levantado.

### 🟠 TEST-04 — Sin umbral de cobertura · MEDIUM

`jest.config.mjs` no define `coverageThreshold` ni recolección por defecto. **No hay porcentaje de cobertura publicado.**

### 🟡 TEST-05 — Contrato sin verificación automática · MEDIUM

`backend-contract.test.ts` necesita un backend accesible. No hay OpenAPI en el repositorio ni tipos generados: **todos los tipos son manuales**. Ver [contract-tests.md](contract-tests.md).

---

## 4. Matriz de trazabilidad

| Journey | Ruta | Componentes | API | Roles | Unit. | Integr. | E2E | Visual | A11y | Estado |
|---|---|---|---|---|:--:|:--:|:--:|:--:|:--:|---|
| Ver la landing | `/` | `PublicLandingLoader`, `SmartImage` | `/public/pages/:slug` | — | ⚠️¹ | ❌ | ✅ | ✅ | ❌ | Parcial |
| Iniciar sesión | `/login`, `/admin/login` | `LoginForm`, `AuthVisualLayout` | `/auth/login` | Todos | ⚠️² | ❌ | ❌ | ❌ | ❌ | **Insuficiente** |
| Registrarse | `/registro` | `RegisterPatientForm` | `/auth/register/patient` | — | ❌ | ❌ | ❌ | ❌ | ❌ | **Ausente** |
| Reservar cita | `/booking`, `/paciente/booking` | `PatientBookingForm` | `/booking/availability`, `/appointments` | `PACIENTE` | ❌ | ❌ | ❌ | ❌ | ❌ | **Ausente** |
| Ver mis citas | `/paciente/citas` | `PatientAppointmentsTable`, `DataTable` | `/appointments/mine` | `PACIENTE` | ❌ | ❌ | ❌ | ❌ | ❌ | **Ausente** |
| Gestionar solicitudes | `/admin/solicitudes` | `RequestsTable` | `/appointments/admin/list` | `ADMIN`+ | ⚠️³ | ❌ | ❌ | ❌ | ❌ | Insuficiente |
| Gestionar usuarios | `/admin/usuarios` | `UsersTable` | `/admin/users*` | `ADMIN`+ | ⚠️³ | ❌ | ❌ | ❌ | ❌ | Insuficiente |
| Definir horarios | `/terapeuta/horarios` | `TherapistScheduleManager` | `/therapists/me/schedules` | `TERAPEUTA` | ❌ | ❌ | ❌ | ❌ | ❌ | **Ausente** |
| Contabilidad | `/admin/contabilidad/*` | `AccountingTable` | `/admin/accounting/*` | `CONTADOR`, `SUPER_ADMIN` | ⚠️³ | ❌ | ❌ | ❌ | ❌ | Insuficiente |
| Publicar contenido | `/admin/contenido/*` | `newsroom-admin` | `/admin/cms/*` | `ADMIN`+ | ⚠️¹ | ❌ | ❌ | ❌ | ❌ | Insuficiente |
| Completar un tutorial | `/*/ayuda` | `TutorialCenter`, `TutorialRun` | — | Todos | ✅ | ✅ | ✅ | ❌ | ❌ | **Buena** |
| Recibir notificaciones | shell admin | `NotificationBell` | SSE | `ADMIN`+ | ❌ | ❌ | ❌ | ❌ | ❌ | **Ausente** |

¹ Solo el normalizador · ² Solo `normalizeSession()` · ³ Solo smoke de existencia de acciones

**Un solo journey de los doce tiene cobertura completa, y es el que no toca el backend.**

---

## 5. Reglas de prueba

1. No reescribir pruebas para ocultar fallos.
2. No actualizar capturas de regresión visual en bloque sin inspeccionarlas.
3. Diferenciar siempre fallo preexistente de regresión nueva. La línea base del 2026-08-03 es **cero fallos**: cualquier fallo posterior es una regresión.
4. Datos sintéticos y deterministas. `no-local-fixtures.test.ts` ya vigila que no se cuelen fixtures locales donde no deben.
5. **Nunca** llamar a servicios productivos desde una prueba.
6. Probar también los caminos negativos: error de red, `401`, `403`, rol insuficiente, sesión caducada, listas vacías.

---

## 6. Plan de mejora propuesto

`CAMBIO DE PRODUCTO` (añade archivos de prueba). **No implementado aquí.**

| # | Acción | Cierra | Esfuerzo |
|---:|---|---|---|
| 1 | Prueba de componente de `Modal` (foco, `Escape`, trampa) | TEST-02 | Bajo |
| 2 | Prueba de componente de `Button` (`loading`→`disabled`, `asChild`) | TEST-02 | Muy bajo |
| 3 | E2E del login con backend simulado | TEST-01 | Medio |
| 4 | E2E de la reserva de cita | TEST-01 | Medio |
| 5 | Ejecutar Playwright en CI | TEST-03 | Bajo |
| 6 | `jest-axe` sobre `shared/ui` | A11Y-01 | Bajo |
| 7 | `coverageThreshold` acordado y creciente | TEST-04 | Bajo |

Las acciones 1 y 2 son las de mejor retorno: coste muy bajo y protegen las dos piezas de mayor centralidad y mayor riesgo del sistema.

---

## 7. Comandos

```bash
yarn test:unit                  # 22 suites, 182 pruebas
yarn test:smoke                 # smoke estático de rutas y documentación
yarn test:ci                    # lint + typecheck + unit + smoke
yarn test:e2e                   # Playwright (requiere navegador instalado)
yarn test:integration:backend   # requiere backend real
yarn test:all                   # test:ci + integración
```

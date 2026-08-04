# Journeys de usuario

- **Fecha de evidencia:** 2026-08-03
- **Método:** verificados contra rutas, componentes, endpoints y pruebas. **No inferidos de nombres de archivo.**

---

## J1 — Iniciar sesión

| | |
|---|---|
| **Problema de negocio** | Dar acceso a cada persona a su portal, con los datos que le corresponden |
| **Actor** | Cualquier rol |
| **Entrada** | `/login` (pacientes) · `/admin/login` (terapeutas, administración, contabilidad) |
| **Precondición** | Cuenta creada en el backend |

**Secuencia**

1. Formulario `LoginForm` sobre `AuthVisualLayout` (`react-hook-form` + `zod`).
2. `POST /api/v1/auth/login`.
3. `normalizeSession()` desenvuelve la respuesta, mapea el rol y **deriva los permisos localmente**.
4. `sessionSchema.parse()` valida; si falla, **lanza** y no hay sesión.
5. `persistClientSession()` escribe `localStorage["cm_session"]` y la cookie `cm_session_role`.
6. `dashboardForRole(role)` decide el destino, salvo que exista `?next=`.

**Estados**

| Estado | Comportamiento |
|---|---|
| Carga | `Button` con `loading` → deshabilitado + `aria-busy` |
| Error de credenciales | `humanizeApiError()` + región `aria-live` en `login-form.tsx` |
| Error de red | `ApiError(status 0)` → «No se pudo conectar con el servidor» |
| Sin `NEXT_PUBLIC_API_BASE_URL` | `ApiError(…, 500)` indicando revisar `.env.local` |
| Éxito | Redirección al panel del rol |

**Destinos:** `PACIENTE`→`/paciente` · `TERAPEUTA`→`/terapeuta` · `CONTADOR`→`/admin/contabilidad` · `ADMIN`/`SUPER_ADMIN`→`/admin`.

**Pruebas:** ⚠️ Solo `session.test.ts` sobre `normalizeSession()`. **Sin prueba del flujo.** `TEST-01`.

---

## J2 — Registrarse como paciente

| | |
|---|---|
| **Actor** | Visitante | **Entrada** | `/registro` |

`RegisterPatientForm` carga catálogos remotos (`fetchCountriesCities`, `fetchOccupations`, `fetchProfessions`, `fetchSpecialties`) desde URLs de `NEXT_PUBLIC_FILE_SERVER_*`, y envía `POST /api/v1/auth/register/patient`.

**Es el formulario más complejo de la aplicación**: peso propio de 5,42 kB y varias fuentes de datos externas. También es la primera interacción de una persona que puede estar en situación de estrés.

**Riesgo verificado:** si una URL de catálogo falla, el desplegable correspondiente queda vacío. No se ha verificado que exista mensaje explicativo en ese caso.

**Pruebas:** ❌ Ninguna. `TEST-01`.

---

## J3 — Reservar una cita  *(journey de mayor valor de negocio)*

| | |
|---|---|
| **Actor** | Paciente (o personal en nombre de un paciente) |
| **Entradas** | `/booking` (muro público) · `/paciente/booking` · `/admin/booking` · `/terapeuta/booking` |

**Tres variantes reales del mismo journey:**

| Variante | Componente | Endpoint de creación | Permiso |
|---|---|---|---|
| Pública | `BookingAuthWall` | — (exige autenticarse antes) | — |
| Paciente | `PatientBookingForm` | `POST /appointments` | `booking:create` |
| Gestionada | `ManagedBookingForm` | `POST /appointments/admin` | `booking:create_for_patient` |

**Secuencia (variante paciente)**

1. Selección de terapeuta → `GET /booking/therapists`.
2. Selección de fecha → `GET /booking/availability`.
3. Selección de franja entre las disponibles.
4. `POST /appointments`.
5. Confirmación por `toast`.

**Estados:** carga de disponibilidad · **sin franjas disponibles** (estado vacío) · error de red · conflicto de franja ya ocupada · éxito.

El estado «sin franjas disponibles» es el más probable en uso real y el que más cuida la experiencia: una persona que no encuentra hueco necesita saber qué hacer a continuación.

**Pruebas:** ❌ Ninguna. Es la ausencia más costosa del proyecto. `TEST-01`.

---

## J4 — Consultar mis citas

Actor: paciente · Ruta: `/paciente/citas` · Componente: `PatientAppointmentsTable` sobre `DataTable` · Endpoint: `GET /appointments/mine`.

Estados: `DataTableSkeleton` → datos · `EmptyState` («Sin resultados») · `ErrorState` con reintento.

`DataTable` acepta `data` como `undefined` o `null` y lo normaliza a `[]`, de modo que un fallo de carga nunca provoca un error de render.

**Pruebas:** ❌ Ninguna.

---

## J5 — Gestionar solicitudes de cita

Actor: `ADMIN`, `SUPER_ADMIN` · Ruta: `/admin/solicitudes` · Componente: `RequestsTable`.

Endpoints: `GET /appointments/admin/list` · `PATCH /appointments/:id/status` · `PATCH /appointments/admin/:id/payment`.

Acciones: confirmar, cancelar, marcar completada, marcar no presentado, registrar pago.

Cada cambio de estado dispara una **notificación por SSE** hacia las campanas conectadas (tipos `APPOINTMENT_CONFIRMED`, `APPOINTMENT_CANCELLED`, etc.).

Confirmaciones destructivas vía `ConfirmProvider`.

**Pruebas:** ⚠️ Solo `admin-actions-smoke.test.ts` (existencia de acciones).

---

## J6 — Definir horarios de atención

Actor: terapeuta · Ruta: `/terapeuta/horarios` · Componente: `TherapistScheduleManager` (10,5 kB propios: de los más pesados).

Endpoints: `/therapists/me/schedules` y `/therapists/me/blocked-times`.

Es el journey que **alimenta la disponibilidad de J3**: sin horarios definidos, ningún paciente puede reservar. La dependencia no es evidente en la interfaz.

**Pruebas:** ❌ Ninguna.

---

## J7 — Contabilidad

Actor: `CONTADOR`, `SUPER_ADMIN` · Rutas: `/admin/contabilidad/*` (índice + 4 subrutas).

`dashboardForRole("CONTADOR")` lleva directamente a `/admin/contabilidad`, aunque el guard permita todo `/admin`. Sus permisos no incluyen `users:manage` ni `therapy:manage`, y la interfaz lo refleja — **pero quien impide el acceso a los datos es el backend**.

Caso destacado: `transactionSaleFromAppointment` crea una venta a partir de una cita pagada, conectando J5 con J7.

**Pruebas:** ⚠️ Solo smoke.

---

## J8 — Publicar contenido

Actor: `ADMIN`, `SUPER_ADMIN` · Rutas: `/admin/contenido/*` (8 subrutas) + `/admin/publicidad/*` (4).

Alcance: publicaciones, portada editorial, autores, categorías, tags, suscriptores, páginas CMS, campañas, creativos, empresas y ubicaciones publicitarias.

Se refleja en el sitio público: `/noticias`, `/novedades`, `/biblioteca`, `/cursos`, `/[slug]`.

⚠️ **`/[slug]` usa `generateStaticParams()`, que se ejecuta en build.** Una página CMS nueva **no aparece hasta el siguiente despliegue**. Es la consecuencia más importante de la exportación estática para el equipo editorial, y existe `FALLBACK_PUBLIC_SLUGS` precisamente por ello.

**Pruebas:** ⚠️ Solo normalizadores.

---

## J9 — Completar un tutorial  *(el mejor cubierto)*

Actor: cualquier rol autenticado · Rutas: `/admin/ayuda`, `/paciente/ayuda`, `/terapeuta/ayuda` + overlay global.

El catálogo se filtra por audiencia mediante `canAccessTutorial()`. El progreso se guarda en `localStorage`; la sincronización remota está tras `NEXT_PUBLIC_TUTORIALS_REMOTE_PROGRESS`, **apagada** porque el endpoint no existe aún en el backend.

**Pruebas:** ✅ 10 suites unitarias + spec E2E `tutorials.spec.ts`. Único journey con cobertura completa.

Documentación propia preexistente: [modules/tutorials-module.md](../modules/tutorials-module.md).

---

## J10 — Recibir notificaciones en tiempo real

Actor: `ADMIN`, `SUPER_ADMIN`, `CONTADOR` (shell de `/admin`) · Componente: `NotificationBell` + `useAdminNotifications`.

Contador vía React Query (`retry: false`; si falla muestra `0` en silencio) y stream vía `EventSource` hacia `/api/v1/admin/notifications/stream?token=<jwt>`.

⚠️ **El JWT viaja en la query string.** Brecha `SEC-01`, severidad CRITICAL. Ver [../security/threat-model.md](../security/threat-model.md).

Ante error, `es.onerror` cierra el stream y **no reintenta**: las notificaciones dejan de llegar hasta recargar. Es una decisión conservadora (evita bucles de reconexión) con coste funcional.

**Pruebas:** ❌ Ninguna.

---

## Resumen

| Journey | Valor de negocio | Cobertura |
|---|---|---|
| J3 Reservar cita | **Máximo** | ❌ Ausente |
| J1 Iniciar sesión | **Máximo** | ⚠️ Parcial |
| J2 Registrarse | Alto | ❌ Ausente |
| J5 Gestionar solicitudes | Alto | ⚠️ Smoke |
| J6 Definir horarios | Alto | ❌ Ausente |
| J4 Ver mis citas | Medio | ❌ Ausente |
| J7 Contabilidad | Medio | ⚠️ Smoke |
| J8 Publicar contenido | Medio | ⚠️ Parcial |
| J10 Notificaciones | Medio | ❌ Ausente |
| J9 Tutoriales | Bajo | ✅ **Completa** |

**La correlación entre valor de negocio y cobertura es inversa.** Es el dato que sustenta `TEST-01` como brecha HIGH.

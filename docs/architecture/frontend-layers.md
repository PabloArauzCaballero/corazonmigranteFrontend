# Capas del frontend

- **Fecha de evidencia:** 2026-08-03

El proyecto usa **arquitectura por features con una capa compartida**. No usa atomic design: no hay carpetas `atoms/`, `molecules/` ni `organisms/`, y no se documentará como si las tuviera.

---

## 1. Las cuatro capas

| Capa | Ruta | Responsabilidad | Puede importar de |
|---|---|---|---|
| **Rutas** | `src/app/` | Definir URLs, layouts, metadatos y fronteras de error. Componer, no decidir | `features/`, `shared/` |
| **Dominio** | `src/features/` | Lógica e interfaz de cada dominio de negocio, incluido su cliente API | `shared/`, `observability/`, `config/` |
| **Compartida** | `src/shared/` | UI reutilizable, cliente HTTP, autenticación, hooks | `observability/`, `config/` |
| **Transversal** | `src/observability/`, `src/config/` | Telemetría y configuración validada | `config/` (solo observabilidad) |

---

## 2. Anatomía de una feature

Estructura típica, verificada en `therapy`, `users`, `accounting`, `booking`:

```
src/features/<dominio>/
├── <dominio>.api.ts        Funciones que llaman a apiRequest() con ENDPOINTS
├── <dominio>.types.ts      Tipos del dominio (algunas features)
├── <componente>.tsx        UI del dominio
└── use-<algo>.ts           Hooks propios (algunas features)
```

Ejemplo real — `notifications`:

```
notifications.api.ts        getUnreadCount, listNotifications, markAllRead, markNotificationRead
use-admin-notifications.ts  Hook que combina React Query + EventSource
notification-bell.tsx       Campana con contador
```

**El módulo `tutorial` es la excepción deliberada.** Al ser un motor y no un CRUD, se organiza por responsabilidad interna:

```
tutorial/
├── model/       tipos, schema zod, app-routes
├── catalog/     definiciones de tutoriales por audiencia
├── engine/      máquina de estados, progreso, hook de ejecución
├── registry/    registro y validación del catálogo
├── storage/     persistencia del progreso
├── analytics/   adaptador de analítica
└── ui/          provider, centro de ayuda, tooltip
```

Esa separación es la que hace posible sus **10 suites de prueba** — el 45 % de toda la cobertura del proyecto.

---

## 3. La capa compartida

### `shared/ui/` — 19 componentes

Sin dependencia de ninguna feature. Detalle en [components/catalog.md](../components/catalog.md).

### `shared/api/` — el punto de salida único

| Archivo | Contenido |
|---|---|
| `client.ts` | `apiRequest()`: autenticación, saneado de cuerpo, reintento por validación, manejo de `401`, trazas |
| `endpoints.ts` | `ENDPOINTS`: ~110 rutas en 13 grupos, todas con prefijo `/api/v1` |
| `errors.ts` | `ApiError` y `humanizeApiError()` (86 aristas: el nodo más conectado del sistema) |
| `normalizers.ts` | `isRecord()`, `getString()`, `normalizePaginatedResponse()` |
| `files.ts` | Subida a Cloudinary con firma del backend |
| `common.ts` | `PaginatedResponse`, `SelectOption`, `ApiValidationError` |

### `shared/auth/` — sesión y RBAC

| Archivo | Contenido |
|---|---|
| `roles.ts` | `ROLES` (5), `PERMISSIONS` (12), `ROLE_PERMISSIONS`, `hasRole()`, `hasPermission()`, `dashboardForRole()` |
| `session.ts` | `sessionSchema` (zod) y `normalizeSession()` — absorbe la heterogeneidad del backend |
| `cookies.ts` | Persistencia, lectura de `exp` del JWT y expiración con margen de 15 s |
| `guard.tsx` | `ClientRoleGuard` — la única protección activa de rutas |
| `use-session.tsx` | `SessionProvider` y `useSession()` |

### `shared/hooks/`

Un único hook: `use-media-query.ts`.

---

## 4. `normalizeSession()` — por qué existe

Es el ejemplo más claro de para qué sirve la capa compartida. El backend devuelve la sesión en formas distintas según el endpoint y la versión, y `normalizeSession()` absorbe toda esa variabilidad:

- Desenvuelve envoltorios anidados: `{data: {...}}`, `{user: {...}}` o plano.
- Busca el token en `token`, `access_token` o `accessToken`, incluso cuando vive en el envoltorio externo mientras los datos de usuario están en `data`.
- Mapea roles de servicio a roles canónicos: `PATIENT → PACIENTE`, `THERAPIST → TERAPEUTA`, `ACCOUNTANT → CONTADOR`.
- Acepta banderas booleanas heredadas: `is_super_admin`, `is_accounter`, `is_admin`, `is_terapeuta`.
- Compone el nombre desde `full_name`, `nombre`, `name` o `firstName + lastName`.
- **Deriva los permisos del rol localmente** y descarta los que envíe el backend.
- Valida el resultado con `sessionSchema.parse()`, que **lanza** si algo falta.

Esa última decisión es importante: los permisos del cliente son informativos. Ver [security/session-and-tokens.md](../security/session-and-tokens.md).

---

## 5. Límites que se cumplen y excepciones

| Límite | Estado | Detalle |
|---|---|---|
| `shared/` no importa de `features/` | ✅ Sin excepciones | — |
| Sin ciclos de importación | ✅ Verificado por Graphify | 0 ciclos en 4 635 aristas |
| Todo HTTP de datos pasa por `apiRequest()` | ⚠️ Una excepción | El stream SSE usa `EventSource` directamente ([containers.md §3](containers.md)) |
| `app/` solo compone | ⚠️ Una excepción | `admin/notificaciones/page.tsx` contiene React Query, mutaciones y paginación |
| Features aisladas entre sí | ⚠️ Cruces legítimos | `public-content` + `public-view` en dos páginas admin; `profile` usa `users.api.ts` |

Las excepciones se documentan como estado real. Corregirlas sería `CAMBIO DE PRODUCTO`.

---

## 6. Dónde poner código nuevo

| Si el código… | Va en |
|---|---|
| Define una URL o su layout | `src/app/` |
| Pertenece a un dominio de negocio concreto | `src/features/<dominio>/` |
| Lo usan dos o más dominios y es visual | `src/shared/ui/` |
| Habla con el backend | `src/features/<dominio>/<dominio>.api.ts` con `ENDPOINTS` |
| Añade una URL de backend | `src/shared/api/endpoints.ts` |
| Es telemetría | `src/observability/` |
| Lee una variable de entorno | `src/config/env.ts` — **nunca** `process.env` directo |

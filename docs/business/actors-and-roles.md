# Actores y roles

- **Fecha de evidencia:** 2026-08-03
- **Evidencia:** [src/shared/auth/roles.ts](../../src/shared/auth/roles.ts)

## 1. Los cinco roles

```ts
export const ROLES = ["PACIENTE", "TERAPEUTA", "ADMIN", "SUPER_ADMIN", "CONTADOR"] as const;
```

| Rol | Quién es | Entra por | Panel |
|---|---|---|---|
| `PACIENTE` | Persona migrante que busca acompañamiento | `/login` | `/paciente` |
| `TERAPEUTA` | Profesional que atiende citas | `/admin/login` | `/terapeuta` |
| `ADMIN` | Gestión operativa | `/admin/login` | `/admin` |
| `SUPER_ADMIN` | Gestión completa, incluida contabilidad | `/admin/login` | `/admin` |
| `CONTADOR` | Gestión económica | `/admin/login` | `/admin/contabilidad` |

Un visitante sin sesión es un actor más: accede a las 15 rutas públicas.

## 2. Matriz de permisos

| Permiso | PACIENTE | TERAPEUTA | ADMIN | SUPER_ADMIN | CONTADOR |
|---|:--:|:--:|:--:|:--:|:--:|
| `admin:read` | | | ✅ | ✅ | ✅ |
| `users:manage` | | | ✅ | ✅ | |
| `therapy:manage` | | | ✅ | ✅ | |
| `therapy:read_assigned` | | ✅ | | | |
| `products:manage` | | | ✅ | ✅ | |
| `public_content:manage` | | | ✅ | ✅ | |
| `accounting:read` | | | | ✅ | ✅ |
| `accounting:manage` | | | | ✅ | ✅ |
| `profile:read` | ✅ | ✅ | | ✅ | ✅ |
| `profile:update` | ✅ | ✅ | | ✅ | ✅ |
| `booking:create` | ✅ | | | | |
| `booking:create_for_patient` | | ✅ | ✅ | ✅ | |

### Dos observaciones sobre la matriz

**a) `ADMIN` no tiene `profile:read` ni `profile:update`**, mientras que `SUPER_ADMIN` y `CONTADOR` sí. Puede ser deliberado (un administrador no gestiona su propio perfil de paciente o terapeuta) o una omisión. Se documenta como estado real; cambiarlo sería `CAMBIO DE PRODUCTO`.

**b) `SUPER_ADMIN` no es un superconjunto estricto de `ADMIN`** en la práctica, sino que añade contabilidad y perfil. La diferencia funcional real entre ambos es el acceso a `/admin/contabilidad`.

## 3. Cómo se determina el rol

`normalizeRole()` en [session.ts](../../src/shared/auth/session.ts) prueba, en orden:

1. `role`, `rol` y cada elemento de `roles[]`, mapeados por `SERVICE_ROLE_MAP` (`PATIENT→PACIENTE`, `THERAPIST→TERAPEUTA`, `ACCOUNTANT→CONTADOR`).
2. Banderas heredadas: `is_super_admin` → `is_accounter` → `is_admin` → `is_terapeuta`.
3. **Por defecto: `PACIENTE`.**

El valor por defecto es el de menor privilegio: fallar hacia el mínimo es la elección correcta.

## 4. Los permisos del cliente son informativos

```ts
const permissions: Permission[] = ROLE_PERMISSIONS[role];
```

`normalizeSession()` **descarta los permisos que envíe el backend** y los deriva del rol. Consecuencia: un permiso concedido individualmente en el backend no será visible en la interfaz.

Es coherente con el principio del §1 de [../security/frontend-security.md](../security/frontend-security.md): la matriz del cliente sirve para decidir qué botón se pinta, nunca para autorizar.

## 5. Dónde se aplica el rol

| Punto | Mecanismo | ¿Activo? |
|---|---|---|
| Layouts privados | `ClientRoleGuard allowedRoles={…}` | ✅ Sí |
| Destino tras el login | `dashboardForRole()` | ✅ Sí |
| Navegación lateral | `adminNav`, `patientNav`, `therapistNav` | ✅ Sí |
| Acciones dentro de una pantalla | `hasPermission()` | ✅ Sí |
| `middleware.ts` | `hasRole()` | ❌ No — inerte con `output: "export"` |
| Segmento de telemetría | `userSegmentFromRole()` | ✅ Sí |

**Divergencia registrada:** `middleware.ts` admite `TERAPEUTA` en `/admin`; `ClientRoleGuard` no. Ver [../routes/route-catalog.md §8](../routes/route-catalog.md) y brecha `SEC-02`.

## 6. Reglas para código nuevo

1. Obtener el rol de `useSession()`, nunca de la cookie.
2. Usar `hasPermission()` para decidir qué se muestra; jamás como control de seguridad.
3. Un permiso nuevo debe añadirse a `PERMISSIONS`, a `ROLE_PERMISSIONS`, al enum de `sessionSchema` **y** a la tabla de §2.
4. Un rol nuevo debe añadirse a `ROLES`, `ROLE_PERMISSIONS`, `SERVICE_ROLE_MAP`, `dashboardForRole()` (el `switch` es exhaustivo por tipo) y `roleFromCookie()`.

El punto 4 tiene una red de seguridad útil: `dashboardForRole()` usa un `switch` sin `default`, de modo que **TypeScript falla la compilación** si se añade un rol y no se le asigna destino.

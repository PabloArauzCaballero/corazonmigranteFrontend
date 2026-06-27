# Auth y RBAC

## Roles normalizados
- `PACIENTE`
- `TERAPEUTA`
- `ADMIN`
- `SUPER_ADMIN`
- `CONTADOR`

## Permisos centralizados
Ver `src/shared/auth/roles.ts`.

## Reglas
- Paciente no accede a `/admin` ni `/terapeuta`.
- Terapeuta accede a `/terapeuta` y, de forma temporal, al layout admin solo si el negocio lo conserva para solicitudes asignadas.
- Contabilidad debe requerir permiso `accounting:read` o `accounting:manage`.
- Rol incorrecto produce `403` humano.

## RIESGO_CM
El backend anterior mezcla flags como `is_admin`, `is_super_admin`, `is_terapeuta`, `is_accounter`. La normalización está centralizada para evitar inconsistencias.

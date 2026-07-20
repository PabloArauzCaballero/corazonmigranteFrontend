# Auth y RBAC

## Roles frontend canónicos
- `PACIENTE`
- `TERAPEUTA`
- `ADMIN`
- `SUPER_ADMIN`
- `CONTADOR`

## Roles backend mapeados
- `PATIENT` -> `PACIENTE`
- `THERAPIST` -> `TERAPEUTA`
- `ACCOUNTANT` -> `CONTADOR`
- `ADMIN` -> `ADMIN`
- `SUPER_ADMIN` -> `SUPER_ADMIN`

## Booking
- `PACIENTE` tiene `booking:create` y puede usar `/paciente/booking`.
- `ADMIN`, `SUPER_ADMIN` y `TERAPEUTA` tienen `booking:create_for_patient`, pero la acción queda bloqueada por falta de endpoint backend definitivo.
- `CONTADOR` no puede crear citas.

## Reglas de seguridad
- El frontend no envía `actorUserId`.
- El booking de paciente no envía `patientUserId`; el backend toma el paciente desde el JWT.
- No hay booking anónimo.
- Las pruebas de integración verifican que `POST /api/v1/appointments` no permita reservas anónimas.

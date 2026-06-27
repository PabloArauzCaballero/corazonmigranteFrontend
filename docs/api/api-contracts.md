# Contratos API

Los endpoints se centralizan en `src/shared/api/endpoints.ts`.

## Auth
- `POST /api/usuarios/login`
- `POST /api/usuarios/signup/paciente`
- `POST /api/usuarios/password-recovery/request`
- `POST /api/usuarios/verify-pin`
- `POST /api/usuarios/password/recovery/update`

## Usuarios
- `GET|POST /api/usuarios/super_usuarios/estado/listar`
- `POST /api/usuarios/signup/admin`
- `POST /api/usuarios/signup/terapeuta`
- `PUT /api/usuarios/admin/modificar`
- `PUT /api/usuarios/terapeuta/modificar`
- `PATCH /api/usuarios/super_usuarios/:userId/estado`

## Terapia
- `GET|POST /api/terapia/admin/citas/solicitudes/listar`
- `POST /api/terapia/citas/registrar`
- `PATCH /api/terapia/citas/estados/actualizar`
- `PATCH /api/terapia/citas/detalle/actualizar`
- `DELETE|PATCH /api/terapia/citas/apagar`
- `GET /api/terapia/booking/bootstrap`
- `GET /api/terapia/horarios/obtener-disponibilidad`

## Productos / enfoques
- `GET|POST /api/terapia/enfoques/listar`
- `POST /api/terapia/enfoques/crear`
- `POST /api/terapia/enfoques/crear-con-archivo`
- `PUT /api/terapia/enfoques/modificar`
- `PUT /api/terapia/enfoques/modificar-con-archivo`
- `PATCH /api/terapia/enfoques/apagar`
- `GET|POST /api/terapia/productos/listar`
- `POST /api/terapia/productos/crear`
- `PUT /api/terapia/productos/modificar`
- `PATCH /api/terapia/productos/apagar`

## Contabilidad
- `GET|POST /api/contabilidad/cuentas/listar`
- `POST /api/contabilidad/cuentas/crear`
- `PUT /api/contabilidad/cuentas/editar`
- `PATCH /api/contabilidad/cuentas/apagar`
- `GET|POST /api/contabilidad/grupos-cuenta/listar`
- `GET|POST /api/contabilidad/centros-costo/listar`
- `GET|POST /api/contabilidad/transacciones/listar`

## PENDIENTE_CM
Confirmar si los listados son `GET` con query params o `POST` con body. La implementación UI está preparada para server-side search; falta ajustar adaptadores por contrato final.

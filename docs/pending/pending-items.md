# Pendientes del frontend Corazón Migrante

## PENDIENTE_BACKEND_CM: Booking asistido por admin/terapeuta
El usuario confirmó que booking debe ser:

1. Paciente autenticado reservando para sí mismo.
2. Admin o terapeuta creando/gestionando una cita para un paciente concreto.

El backend actual permite `POST /api/v1/appointments` con rol paciente y toma `patientUserId` desde el JWT. Falta un endpoint para `ADMIN`, `SUPER_ADMIN` o `THERAPIST` que reciba `patientUserId` explícito y valide permisos.

## PENDIENTE_CM: Selector real de terapeuta
`GET /api/v1/booking/availability` exige `therapistUserId`, pero no se encontró en el backend actual un endpoint público/operativo claro para listar terapeutas disponibles. El frontend usa campo UUID temporal, sin mockups.

## PENDIENTE_CM: Shapes finales de backend
Confirmar respuesta exacta para:
- productos terapéuticos;
- disponibilidad;
- citas propias;
- citas admin;
- usuarios admin;
- CMS público;
- contabilidad.

## PENDIENTE_CM: Texto legal
Privacidad y términos deben revisarse jurídicamente.

## PENDIENTE_CM: Permisos de contabilidad
Validar si `CONTADOR`, `ADMIN` o solo `SUPER_ADMIN` acceden a cada submódulo.

## RIESGO_CM: Datos sensibles
No agregar campos clínicos detallados en storage local, logs ni query params. Cualquier información sensible debe venir bajo permisos y minimización.
## PENDIENTE_CM_BACKEND_CMS_PUBLIC_ASSET_URL

El backend debería resolver públicamente las imágenes CMS subidas a `POST /api/v1/files` cuando `visibility=PUBLIC`, idealmente devolviendo `content.imageUrl` en `GET /api/v1/public/pages/:slug` o exponiendo una ruta pública de assets CMS.

## PENDIENTE_CM_BACKEND_ACCOUNTING_COST_CENTERS_LIST
El backend actual expone `POST /api/v1/admin/accounting/cost-centers`, pero no expone `GET /api/v1/admin/accounting/cost-centers`. La vista de centros de costo queda preparada, pero muestra pendiente de contrato en vez de consumir un endpoint inexistente.

## PENDIENTE_CM_BACKEND_ACCOUNTING_TRANSACTIONS_LIST
El backend actual expone `POST /api/v1/admin/accounting/transactions`, pero no expone `GET /api/v1/admin/accounting/transactions`. La vista de transacciones queda preparada, pero muestra pendiente de contrato en vez de consumir un endpoint inexistente.

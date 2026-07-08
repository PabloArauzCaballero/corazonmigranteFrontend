# Pendientes del frontend Corazón Migrante

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
Privacidad y términos deben revisarse jurídicamente. Sin una revisión legal real (por un abogado o el equipo legal del cliente), el frontend no debe presentar un texto de privacidad/términos generado automáticamente como si fuera válido — hay contenido sensible de salud/migración de por medio.

## RIESGO_CM: Datos sensibles
No agregar campos clínicos detallados en storage local, logs ni query params. Cualquier información sensible debe venir bajo permisos y minimización.

## PENDIENTE_CM_BACKEND_CMS_PUBLIC_ASSET_URL
El backend debería resolver públicamente las imágenes CMS subidas a `POST /api/v1/files` cuando `visibility=PUBLIC`, idealmente devolviendo `content.imageUrl` en `GET /api/v1/public/pages/:slug` o exponiendo una ruta pública de assets CMS.

## RESUELTO_CM_BACKEND_HTTP_400_FORMATO_INVALIDO (2026-07-07)
Causa raíz encontrada: la base de datos (Neon) tenía 4 migraciones ya escritas en `backend/src/database/migrations` pero nunca aplicadas (`db:migrate:status` las mostraba `down`). Sin esas migraciones, varias tablas/columnas que el código ya asume que existen (`content_subscribers.user_id`, `ads_campaign_content_targets.page_slug`, etc.) no existían, y Sequelize lanzaba `SequelizeDatabaseError` ("column ... does not exist"), que el `HttpExceptionFilter` normaliza genéricamente a `HTTP_400 / "La solicitud contiene datos con un formato inválido." / details: []` sin dar pista del campo real.

Se aplicaron las 4 migraciones pendientes (`npx sequelize-cli db:migrate` en `backend/`):
- `20260704165000-fix-pivot-uuid-defaults-and-unique-indexes`
- `20260705020000-schema-compatibility-and-premium-news`
- `20260706193000-content-subscribers-patient-link-backfill`
- `20260706212000-advertising-page-targets`

Verificado en vivo tras el fix: `GET /me/news-subscription`, `GET /advertising/slots` y `GET /booking/availability` responden `200` normalmente. **Recomendación**: agregar `db:migrate` al pipeline de deploy/arranque del backend para que esto no vuelva a pasar.

## RESUELTO_CM_BACKEND_ACCOUNTING_RBAC (2026-07-07)
Verificado con una cuenta `SUPER_ADMIN` recién logueada: el JWT sí trae `accounting:read`/`accounting:write` y `GET /admin/accounting/account-groups` responde `200`. El código de `PermissionsGuard`/seed de permisos es correcto. Si vuelve a aparecer `RBAC_PERMISSION_DENIED`, probablemente sea un token viejo (expira a los 15 min) emitido antes de que se corrigieran los permisos/migraciones — pedir al usuario que cierre sesión y vuelva a entrar antes de investigar más.

## RESUELTO_CM_BACKEND_ACCOUNTING_COST_CENTERS_LIST (2026-07-07)
Se agregó `GET /api/v1/admin/accounting/cost-centers` en `backend/src/modules/accounting/{accounting.controller.ts,accounting.service.ts}`. El frontend (`accounting.api.ts`) ya lo consume.

## RESUELTO_CM_BACKEND_ACCOUNTING_TRANSACTIONS_LIST (2026-07-07)
Se agregó `GET /api/v1/admin/accounting/transactions` (incluye `entries`) en el mismo módulo. El frontend ya lo consume.

## RESUELTO_CM_BACKEND_BOOKING_ASISTIDO (2026-07-07)
Se agregó `POST /api/v1/appointments/admin` en `backend/src/modules/appointments/` (`@Roles('ADMIN','SUPER_ADMIN','THERAPIST') @Permissions('appointments:write')`), que recibe `patientUserId` explícito en el body además de terapeuta/producto/horario. El frontend (`createManagedBooking` en `booking.api.ts`) ya apunta a este endpoint en vez de lanzar el error "no soportado".

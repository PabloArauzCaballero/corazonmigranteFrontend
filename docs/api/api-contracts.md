# Contratos API alineados al backend NestJS `/api/v1`

Los endpoints se centralizan en `src/shared/api/endpoints.ts`. Esta versión ya no apunta a rutas legacy tipo `/api/usuarios/*` ni `/api/terapia/*`; usa el contrato reingenierizado del backend NestJS bajo `/api/v1`.

## Auth
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register/patient`
- `POST /api/v1/auth/register/therapist`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/password-reset/request`
- `POST /api/v1/auth/password-reset/confirm`

## Usuario actual y usuarios administrativos
- `GET /api/v1/me`
- `PATCH /api/v1/me/patient-profile`
- `PATCH /api/v1/me/therapist-profile`
- `GET /api/v1/admin/users`

## Booking y citas
- `GET /api/v1/booking/availability`
- `POST /api/v1/appointments`
- `GET /api/v1/appointments/mine`
- `GET /api/v1/appointments/admin/list`
- `PATCH /api/v1/appointments/:appointmentId/status`

### Regla aplicada en frontend
- `/booking` ya no muestra formulario público. Solo actúa como puerta de sesión.
- `/paciente/booking` permite reservar para el paciente autenticado.
- El frontend no envía `patientUserId` en booking de paciente, porque el backend debe tomarlo del JWT.
- `/admin/booking` y `/terapeuta/booking` exigen paciente concreto, pero no crean la cita todavía porque el backend actual no expone contrato para admin/terapeuta creando por `patientUserId`.

### PENDIENTE_BACKEND_CM
Agregar contrato backend para crear cita asistida por `ADMIN`, `SUPER_ADMIN` o `THERAPIST` para un paciente concreto, por ejemplo:

```http
POST /api/v1/appointments/admin/create-for-patient
Authorization: Bearer <token admin/therapist>
Content-Type: application/json

{
  "patientUserId": "uuid-paciente",
  "therapistUserId": "uuid-terapeuta",
  "productId": "uuid-producto",
  "scheduledStartAt": "2026-07-01T10:00:00",
  "timezone": "America/La_Paz",
  "notesForTherapist": "texto opcional"
}
```

Sin ese contrato, usar `POST /api/v1/appointments` desde admin/terapeuta sería incorrecto porque el backend actual crea la cita usando `user.sub` como paciente.

## Catálogo terapéutico
- Público:
  - `GET /api/v1/therapy/approaches`
  - `GET /api/v1/therapy/products`
- Admin:
  - `GET /api/v1/admin/therapy/approaches`
  - `POST /api/v1/admin/therapy/approaches`
  - `PATCH /api/v1/admin/therapy/approaches/:approachId`
  - `GET /api/v1/admin/therapy/products`
  - `POST /api/v1/admin/therapy/products`
  - `PATCH /api/v1/admin/therapy/products/:productId`
  - `DELETE /api/v1/admin/therapy/products/:productId`

## CMS público
- `GET /api/v1/public/pages/:slug`
- `POST /api/v1/admin/cms/pages`
- `POST /api/v1/admin/cms/pages/:pageId/elements`

## Contabilidad
- `GET /api/v1/admin/accounting/account-groups`
- `POST /api/v1/admin/accounting/account-groups`
- `GET /api/v1/admin/accounting/accounts`
- `POST /api/v1/admin/accounting/accounts`
- `POST /api/v1/admin/accounting/cost-centers`
- `POST /api/v1/admin/accounting/transactions`

## PENDIENTE_CM
Confirmar shapes definitivos de respuestas, paginación y filtros por endpoint. La UI mantiene normalizadores defensivos, pero las pruebas de integración deben ampliarse cuando me pases el detalle final.

## CMS / Biblioteca pública alineado al backend real

Contratos usados por el módulo profesional de biblioteca:

- `GET /api/v1/public/pages/:slug` — carga página publicada con elementos activos.
- `POST /api/v1/admin/cms/pages` — crea página CMS, requiere `ADMIN` o `SUPER_ADMIN` y permiso `cms:write`.
- `POST /api/v1/admin/cms/pages/:pageId/elements` — agrega bloque a página CMS.
- `POST /api/v1/files` — sube imagen/documento con `module=CMS` y `visibility=PUBLIC`.

No se usan endpoints `/public/content/articles` ni `/admin/cms/articles` porque no existen en el backend recibido.

PENDIENTE_CM_BACKEND_CMS_PUBLIC_ASSET_URL: resolver públicamente assets CMS por `fileId` o devolver `imageUrl` dentro del contenido de cada elemento.

## Contrato landing configurable / Vistas Públicas

La landing `/` se alimenta desde backend. No debe tener mockups locales.

Endpoints públicos soportados:

```txt
GET /api/v1/public/pages/:slug
GET /api/v1/public/pages/by-id/:id
GET /api/v1/public/pages/:slug/elements/:code
GET /api/v1/public/page-elements/:id
GET /api/v1/public-views/:id
GET /api/v1/public-views/:id/elements/:code
```

Configuración recomendada para Corazón Migrante:

```env
NEXT_PUBLIC_PUBLIC_VIEW_MODE=public-view-id
NEXT_PUBLIC_PUBLIC_VIEW_SLUG=1
```

Nota: `NEXT_PUBLIC_PUBLIC_VIEW_SLUG` conserva el nombre legacy, pero puede contener el id numérico esperado por `/api/v1/public-views/:id`.

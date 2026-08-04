# Pendientes del frontend Corazón Migrante

## RIESGO_CM_SSE_TOKEN_EN_QUERY
`useAdminNotifications` abre el stream SSE como
`/admin/notifications/stream?token=<JWT>` porque la API `EventSource` del navegador no
permite enviar cabeceras. Eso mete un token de sesión en la URL, que queda en logs de
acceso, proxies e historial — justo lo que prohíbe `RIESGO_CM: Datos sensibles`.
Mitigación recomendada en backend: emitir un **ticket de un solo uso y vida corta**
(p. ej. `POST /admin/notifications/stream-ticket` → `?ticket=…` válido 30 s) en vez de
aceptar el JWT completo por query.

## RESUELTO_CM_MODO_OSCURO (2026-08-03)
Implementado el tema oscuro completo, incluida la landing pública. El enfoque no fue
añadir variantes `dark:` a los componentes sino resolver el tema **en la capa de
tokens**: se migraron 277 literales hexadecimales y 250 usos de `white`/`black` a
roles semánticos, y las cinco paletas de Tailwind que el proyecto usaba (`teal`,
`slate`, `emerald`, `amber`, `red`) se redirigieron a variables CSS, de modo que ~490
usos ya existentes responden al tema sin tocar ni un componente. Detalle en
`docs/design-system/themes.md`, `docs/design-system/tokens.md` y `ADR-0011`.

Retirada también la contradicción de `colorScheme: "light"` fijo con `themeColor`
oscuro: ahora `color-scheme` lo declaran `:root`/`.dark` y la barra del navegador sigue
a la elección manual, no solo al sistema.

## PENDIENTE_CM_CONTRASTE_OSCURO (2026-08-03)
El tema oscuro se construyó conservando las luminosidades de la escala de partida, y
`tests/e2e/theme.spec.ts` comprueba que texto y fondo caigan en lados opuestos de la
escala. **No se ha ejecutado una auditoría de contraste WCAG par por par sobre el tema
oscuro** (Axe/Lighthouse con la clase `dark` activa). Es el complemento natural de
`docs/accessibility/color-and-contrast.md`, que hoy solo cubre el tema claro.

## RESUELTO_CM_ENV_PRODUCCION (2026-08-03)
`assertDeployableAppUrl` (`src/config/env.ts`) rompe el build **en CI** si
`NEXT_PUBLIC_APP_URL` apunta a un host local, y avisa una vez sin bloquear fuera de CI
(hacer `yarn build` con el `.env` de desarrollo es legítimo). El workflow ya no fija
`http://localhost:3000`: usa la variable de repositorio `PUBLIC_APP_URL` y, si no está
definida, **no publica el artefacto** — subir un export con canónicas incorrectas es
peor que no subir nada.

Queda una acción de configuración fuera del repositorio: **definir `vars.PUBLIC_APP_URL`
en GitHub con el dominio real**. Corregido también `NEXT_PUBLIC_APP_NAME` en
`.env.example`, que valía `Corazon Migrante` sin tilde y se mostraba así en el manifest.

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

## PENDIENTE_CM_TUTORIALES_BACKEND (2026-08-03)
El motor de tutoriales (`docs/modules/tutorials-module.md`) guarda el progreso solo en
`localStorage`: el backend todavía no expone `/api/v1/me/tutorials/progress`. El contrato
propuesto está documentado en `docs/api/api-contracts.md` y el adaptador remoto ya está
implementado y probado. Cuando el backend lo publique, basta con poner
`NEXT_PUBLIC_TUTORIALS_REMOTE_PROGRESS=true` para que el avance viaje entre dispositivos.
Hasta entonces, quien cambie de navegador vuelve a ver sus tutoriales como pendientes.

## RESUELTO_CM_TUTORIALES_MENU_MOVIL (2026-08-03)
Los pasos que resaltan enlaces del menú lateral no encontraban su objetivo en móvil
mientras el cajón de navegación estuviera cerrado. Se resolvió con un campo genérico del
motor, `TutorialStep.prepare`, que abre el desplegable que esconde el objetivo antes de
buscarlo (`openDisclosure` en `engine/target-resolver.ts`). No hubo que acoplar
`DashboardShell` al módulo: el control se identifica por `data-tutorial-id` y solo se
pulsa si declara `aria-expanded="false"`, es decir, si es un desplegable — un botón de
guardar, pagar o eliminar nunca puede activarse por esta vía. Sirve igual para acordeones
y pestañas. Cubierto por `tests/unit/tutorial-run.test.tsx` (abre, no re-pulsa lo ya
abierto, y no toca controles que no sean desplegables).

## PENDIENTE_CM_OTEL_CONSENTIMIENTO (2026-08-03)
La trazabilidad con OpenTelemetry está implementada y probada, pero **desactivada por
defecto también en producción** (`NEXT_PUBLIC_OTEL_ENABLED=false`). Encenderla requiere
antes la revisión de privacidad de `docs/observability/frontend/05-data-privacy-policy.md`:
este producto trata datos de salud mental de personas migrantes, y hay que decidir con la
política vigente (`/privacidad`, `/terminos`) si la telemetría es "estrictamente necesaria"
o si exige consentimiento previo. No se ha creado ningún banner nuevo a propósito:
duplicar mecanismos sin conocer la política publicada sería peor que no hacerlo. También
falta nombrar a las personas responsables de la tabla §11 de ese documento.

## PENDIENTE_CM_OTEL_PROPAGACION_BACKEND (2026-08-03)
`NEXT_PUBLIC_OTEL_PROPAGATE_BACKEND=false`. Activarlo añade la cabecera `traceparent` a
las llamadas al backend, que es lo que permite ver una sola traza desde el clic hasta
PostgreSQL. Convierte peticiones simples en peticiones con preflight, así que **rompe la
aplicación si el backend no declara antes**:
`Access-Control-Allow-Headers: content-type, authorization, traceparent, tracestate`.
El orden obligatorio (backend → verificar con curl → frontend → staging → producción) está
en `docs/observability/frontend/06-runbook.md` §3. Hasta entonces hay trazas de navegador
completas, pero sin correlación con el backend.

## PENDIENTE_CM_CSP_CONNECT_SRC (2026-08-03)
`public/_headers` tenía `connect-src *`. Se cerró a `connect-src 'self' https:`, que ya
elimina el tráfico en claro y los WebSockets a cualquier host. El cierre definitivo es la
lista explícita de orígenes:
`connect-src 'self' https://api.EL-DOMINIO-REAL https://res.cloudinary.com`.
No se puede hacer desde el repositorio porque el dominio real del backend vive en
`NEXT_PUBLIC_API_BASE_URL`, fuera del control de versiones, y escribir uno inventado
dejaría la aplicación sin API. La telemetría no exige abrir nada: su endpoint es del
mismo origen y lo cubre `'self'`.

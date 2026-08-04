# Catálogo de rutas

- **Fecha de evidencia:** 2026-08-03
- **Fuente:** salida real de `next build` (69 rutas) + árbol `src/app/`
- **Naturaleza:** `DOCUMENTAL`

Cobertura: **100 % de las rutas registradas por el build**. Cada fila indica ruta, layout, componente de negocio, acceso, roles y tamaño real del bundle.

## Cómo leer la columna «Acceso»

| Valor | Significado |
|---|---|
| **Público** | Alcanzable sin sesión |
| **Guardada** | Envuelta por `ClientRoleGuard`; sin sesión redirige al login indicado |
| **Sistema** | Ruta generada por el framework (metadatos, error, 404) |

> ⚠️ **Advertencia de seguridad que aplica a todas las filas «Guardada».** El HTML de las rutas privadas se exporta estáticamente y **es descargable sin sesión**. `ClientRoleGuard` protege la *interfaz*, no los *datos*. Quien decide qué información se entrega es el backend, validando el JWT en cada endpoint. Ver [security/frontend-security.md](../security/frontend-security.md).

---

## 1. Rutas públicas

Layout: [src/app/(public)/layout.tsx](../../src/app/(public)/layout.tsx) → `PublicShell` (navbar + footer públicos).

| Ruta | Tipo | Página | Componente de negocio | First Load JS | Datos |
|---|---|---|---|---:|---|
| `/` | ○ Estática | [app/page.tsx](../../src/app/page.tsx) | `PublicLandingLoader` | **194 kB** | `GET /api/v1/public/pages/:slug` (landing configurable) |
| `/[slug]` | ● SSG | [(public)/[slug]/page.tsx](../../src/app/(public)/[slug]/page.tsx) | `EditorialPublicPage` | 177 kB | `listCmsPages()` → CMS. `generateStaticParams` produce `/inicio` |
| `/biblioteca` | ○ Estática | [(public)/biblioteca](../../src/app/(public)/biblioteca/page.tsx) | `EditorialPublicPage` | 177 kB | CMS, slug de `NEXT_PUBLIC_CMS_LIBRARY_SLUG` |
| `/biblioteca/recurso` | ○ Estática | [(public)/biblioteca/recurso](../../src/app/(public)/biblioteca/recurso/page.tsx) | `EditorialResourceQueryPage` | 164 kB | Recurso identificado por *query string* |
| `/cursos` | ○ Estática | [(public)/cursos](../../src/app/(public)/cursos/page.tsx) | `EditorialPublicPage` | 177 kB | CMS |
| `/noticias` | ○ Estática | [(public)/noticias](../../src/app/(public)/noticias/page.tsx) | `NewsPublicPage` | 168 kB | Newsroom público |
| `/noticias/detalle` | ○ Estática | [(public)/noticias/detalle](../../src/app/(public)/noticias/detalle/page.tsx) | `NewsDetailFromQuery` (en `Suspense`) | 163 kB | Publicación por *query string* |
| `/novedades` | ○ Estática | [(public)/novedades](../../src/app/(public)/novedades/page.tsx) | `NewsPublicPage` | 168 kB | Newsroom público |
| `/novedades/detalle` | ○ Estática | [(public)/novedades/detalle](../../src/app/(public)/novedades/detalle/page.tsx) | `NewsDetailFromQuery` (en `Suspense`) | 163 kB | Publicación por *query string* |
| `/booking` | ○ Estática | [(public)/booking](../../src/app/(public)/booking/page.tsx) | `BookingAuthWall` | 179 kB | Muro de autenticación previo a reservar |
| `/login` | ○ Estática | [(public)/login](../../src/app/(public)/login/page.tsx) | `LoginForm` + `AuthVisualLayout` | 168 kB | `POST /api/v1/auth/login` |
| `/admin/login` | ○ Estática | [(public)/admin/login](../../src/app/(public)/admin/login/page.tsx) | `LoginForm` + `AuthVisualLayout` | 168 kB | `POST /api/v1/auth/login` |
| `/registro` | ○ Estática | [(public)/registro](../../src/app/(public)/registro/page.tsx) | `RegisterPatientForm` | 175 kB | `POST /api/v1/auth/register/patient` |
| `/privacidad` | ○ Estática | [(public)/privacidad](../../src/app/(public)/privacidad/page.tsx) | Contenido estático (`Card` + `PageHeader`) | 101 kB | Ninguno |
| `/terminos` | ○ Estática | [(public)/terminos](../../src/app/(public)/terminos/page.tsx) | Contenido estático (`Card` + `PageHeader`) | 101 kB | Ninguno |

**Nota sobre `/admin/login`:** vive físicamente bajo el grupo `(public)`, por eso **no** queda envuelta por el guard del panel. Es intencional — de lo contrario nadie podría iniciar sesión. El middleware la lista además en `publicAdminPaths`.

**Nota sobre `/noticias` y `/novedades`:** ambas renderizan el mismo componente `NewsPublicPage` y difieren solo en metadatos. Es duplicación consciente de rutas de cara al SEO, no un error.

---

## 2. Portal de administración (`/admin`)

Layout: [src/app/admin/layout.tsx](../../src/app/admin/layout.tsx)
Guard: `ClientRoleGuard allowedRoles={["ADMIN","SUPER_ADMIN","CONTADOR"]} loginPath="/admin/login"`
Metadatos: `robots: { index: false, follow: false }` + `X-Robots-Tag: noindex` y `Cache-Control: no-store` desde [public/_headers](../../public/_headers).
Shell: `DashboardShell` con `adminNav` y campana de notificaciones (`showNotifications`).

| Ruta | Componente de negocio | First Load JS | Endpoints principales |
|---|---|---:|---|
| `/admin` | `AdminOverview` + `ProfileCard` | 167 kB | Resumen de citas y usuarios |
| `/admin/solicitudes` | `RequestsTable` | 173 kB | `GET /appointments/admin/list`, `PATCH /appointments/:id/status` |
| `/admin/usuarios` | `UsersTable` | 170 kB | `GET/POST/PATCH /admin/users*` |
| `/admin/booking` | `ManagedBookingForm` | 179 kB | `GET /booking/availability`, `POST /appointments/admin` |
| `/admin/archivos` | `FilesAdmin` | 164 kB | `GET/POST/DELETE /admin/files*`, firma Cloudinary |
| `/admin/descargables` | `DownloadablesAdmin` | 161 kB | Descargables y versiones |
| `/admin/notificaciones` | Página propia con React Query | 158 kB | `listNotifications`, `markAllRead`, `markNotificationRead` |
| `/admin/ayuda` | `TutorialCenter` | 169 kB | Ninguno (catálogo local) |
| **Contabilidad** | | | |
| `/admin/contabilidad` | Índice de tarjetas de navegación | 104 kB | Ninguno |
| `/admin/contabilidad/cuentas` | `AccountingTable` + `CreateAccountButton` | 163 kB | `/admin/accounting/accounts` |
| `/admin/contabilidad/grupos-cuenta` | `AccountingTable` + `CreateAccountGroupButton` | 163 kB | `/admin/accounting/account-groups` |
| `/admin/contabilidad/centros-costo` | `AccountingTable` + `CreateCostCenterButton` | 163 kB | `/admin/accounting/cost-centers` |
| `/admin/contabilidad/transacciones` | `TransactionsTable` + `CreateTransactionButton` | 163 kB | `/admin/accounting/transactions` |
| **Contenido / CMS** | | | |
| `/admin/contenido/editorial` | `EditorialAdminPage` | 172 kB | `/admin/cms/pages*` |
| `/admin/contenido/paginas` | `PublicContentTable` + `AdminPublicPreview` | 158 kB | `/admin/cms/pages`, `/public/pages/:slug` |
| `/admin/contenido/publicaciones` | `PublicationsAdmin` | 186 kB | Newsroom admin |
| `/admin/contenido/publico` | `PublicationsAdmin` | 186 kB | Newsroom admin |
| `/admin/contenido/homepage` | `HomepageAdmin` | 186 kB | Portada editorial |
| `/admin/contenido/autores` | `AuthorsAdmin` | 186 kB | Taxonomía |
| `/admin/contenido/categorias` | `CategoriesAdmin` | 186 kB | Taxonomía |
| `/admin/contenido/tags` | `TagsAdmin` | 186 kB | Taxonomía |
| `/admin/contenido/suscriptores` | `SubscribersAdmin` | 186 kB | `/admin/content/subscribers*` |
| `/admin/vistas-publicas` | `PublicContentTable` + `AdminPublicPreview` | 158 kB | Igual que `/admin/contenido/paginas` |
| **Publicidad** | | | |
| `/admin/publicidad` | `redirect()` — no renderiza UI | 101 kB | Ninguno |
| `/admin/publicidad/campanas` | `AdsCampaignsAdmin` | 186 kB | Campañas |
| `/admin/publicidad/creativos` | `AdsCreativesAdmin` | 186 kB | Creativos |
| `/admin/publicidad/empresas` | `AdsCompaniesAdmin` | 186 kB | Anunciantes |
| `/admin/publicidad/ubicaciones` | `AdsPlacementsVisual` | 157 kB | Ubicaciones |
| **Productos** | | | |
| `/admin/productos/enfoques` | `CatalogTable` | 163 kB | `/admin/therapy/approaches*` |
| `/admin/productos/servicios` | `CatalogTable` | 163 kB | `/admin/therapy/products*` |

**Duplicación funcional detectada:** `/admin/contenido/paginas` y `/admin/vistas-publicas` renderizan exactamente los mismos dos componentes; `/admin/contenido/publicaciones` y `/admin/contenido/publico` renderizan ambos `PublicationsAdmin`. Se documenta como estado real. Consolidarlas sería `CAMBIO DE PRODUCTO` y no se propone aquí. Registrado como brecha `ROUTE-02`.

---

## 3. Portal de paciente (`/paciente`)

Layout: [src/app/paciente/layout.tsx](../../src/app/paciente/layout.tsx)
Guard: `allowedRoles={["PACIENTE"]} loginPath="/login"` · `noindex` + `no-store`

| Ruta | Componente de negocio | First Load JS | Endpoints principales |
|---|---|---:|---|
| `/paciente` | `ProfileCard` + `StatCard` | 118 kB | Perfil propio |
| `/paciente/citas` | `PatientAppointmentsTable` | 163 kB | `GET /appointments/mine` |
| `/paciente/booking` | `PatientBookingForm` | 179 kB | `GET /booking/availability`, `POST /appointments` |
| `/paciente/perfil` | `PatientProfileForm` + `ProfilePhotoUploader` | 163 kB | `PATCH /me/patient-profile`, `POST /me/avatar` |
| `/paciente/descargables` | `MyDownloadablesLibrary` | 162 kB | Biblioteca personal |
| `/paciente/premium` | `PatientPremiumPage` | 168 kB | `/me/news-subscription*`, `/premium/publications/*` |
| `/paciente/ayuda` | `TutorialCenter` | 169 kB | Ninguno |

**Observación honesta sobre `/paciente`:** el panel muestra una tarjeta «Mensajes» con el texto *«Pendiente de activar en el sistema.»* Es una funcionalidad **anunciada pero no implementada**. Se documenta como tal y no como capacidad existente.

---

## 4. Portal de terapeuta (`/terapeuta`)

Layout: [src/app/terapeuta/layout.tsx](../../src/app/terapeuta/layout.tsx)
Guard: `allowedRoles={["TERAPEUTA"]} loginPath="/admin/login"` · `noindex` + `no-store`

| Ruta | Componente de negocio | First Load JS | Endpoints principales |
|---|---|---:|---|
| `/terapeuta` | `ProfileCard` + `StatCard` | 118 kB | Perfil propio |
| `/terapeuta/agenda` | `TherapistAgendaTable` | 160 kB | `GET /appointments/mine` |
| `/terapeuta/horarios` | `TherapistScheduleManager` | 160 kB | `/therapists/me/schedules`, `/therapists/me/blocked-times` |
| `/terapeuta/booking` | `ManagedBookingForm` | 179 kB | `GET /booking/availability`, `POST /appointments/admin` |
| `/terapeuta/perfil` | `TherapistProfileForm` + `ProfilePhotoUploader` | 163 kB | `PATCH /me/therapist-profile`, `POST /me/avatar` |
| `/terapeuta/ayuda` | `TutorialCenter` | 169 kB | Ninguno |

**El terapeuta entra por `/admin/login`**, no por `/login`. Es intencional: `/login` es la puerta de pacientes. Tras autenticarse, `dashboardForRole("TERAPEUTA")` lo lleva a `/terapeuta`.

---

## 5. Rutas de sistema

| Ruta | Archivo | Propósito |
|---|---|---|
| `/403` | [app/403/page.tsx](../../src/app/403/page.tsx) | Destino del `rewrite` del middleware ante rol insuficiente |
| `/_not-found` | [app/not-found.tsx](../../src/app/not-found.tsx) | 404; se exporta también como `404.html` |
| `/robots.txt` | [app/robots.ts](../../src/app/robots.ts) | Generado |
| `/sitemap.xml` | [app/sitemap.ts](../../src/app/sitemap.ts) | Generado |
| `/manifest.webmanifest` | [app/manifest.ts](../../src/app/manifest.ts) | Manifiesto PWA |
| `/icon.svg` | Convención de App Router | Icono del sitio |

---

## 6. Route Handlers que NO llegan a producción

| Ruta | Archivo | Marca del build | Realidad |
|---|---|---|---|
| `/api/debug-log` | [app/api/debug-log/route.ts](../../src/app/api/debug-log/route.ts) | `ƒ (Dynamic)` | **No existe en `out/`.** Solo funciona en `next dev`; `client.ts` únicamente lo llama si `NODE_ENV === "development"` |
| `/api/otel/traces` | [app/api/otel/traces/route.ts](../../src/app/api/otel/traces/route.ts) | `ƒ (Dynamic)` | **No existe en `out/`.** En producción la telemetría la recibe la Pages Function [functions/otel/v1/traces.ts](../../functions/otel/v1/traces.ts) en `/otel/v1/traces` |

Verificado empíricamente: tras `yarn build`, el directorio `out/api/` **no se genera**. Es la consecuencia directa de `output: "export"`.

---

## 7. Redirecciones y reescrituras

| Origen | Destino | Mecanismo | ¿Activo en producción? |
|---|---|---|---|
| `/admin/publicidad` | subruta de publicidad | `redirect()` en el propio `page.tsx` | ✅ Sí (se resuelve en el cliente) |
| Ruta guardada sin sesión | `loginPath` + `?next=<ruta>` | `ClientRoleGuard` (`router.replace`) | ✅ Sí |
| Respuesta `401` en petición autenticada | `/login` o `/admin/login` + `?next=` | `handleUnauthorizedSession()` en `client.ts` | ✅ Sí |
| Tras iniciar sesión | `dashboardForRole(role)` | `roles.ts` | ✅ Sí |
| Ruta protegida con rol insuficiente | `/403` | `NextResponse.rewrite` en `middleware.ts` | ❌ **No** — el middleware no se ejecuta con `output: "export"` |
| Rol insuficiente (real) | `ForbiddenState` en el sitio | `ClientRoleGuard` | ✅ Sí — se muestra en la misma URL, sin cambiar de ruta |

---

## 8. Alineación entre las dos capas de protección

El encabezado de [middleware.ts](../../middleware.ts) advierte: *«Si se añade una ruta protegida hay que actualizar AMBOS sitios»*. La auditoría encontró que **no lo estaban**, y se corrigió:

| Prefijo | Roles en `middleware.ts` | Roles en `ClientRoleGuard` | Estado |
|---|---|---|---|
| `/paciente` | `PACIENTE` | `PACIENTE` | ✅ |
| `/terapeuta` | `TERAPEUTA` | `TERAPEUTA` | ✅ |
| `/admin` | `ADMIN`, `SUPER_ADMIN`, `CONTADOR` | `ADMIN`, `SUPER_ADMIN`, `CONTADOR` | ✅ **alineado** |

`TERAPEUTA` sobraba en el middleware: su portal es `/terapeuta` y el guard del layout de admin nunca lo incluyó. Estaba por arrastre y era la única divergencia entre ambas capas.

**Impacto del cambio hoy: ninguno**, porque el middleware es inerte con `output: "export"`. El valor es futuro: si se migrara a un despliegue con servidor, un `TERAPEUTA` habría pasado el filtro del middleware hacia `/admin` para ser detenido después por el guard con `ForbiddenState` — resultado correcto, pero defensa en profundidad degradada y diagnóstico confuso.

El archivo incluye ahora un comentario que señala cuál es la fuente de verdad de cada prefijo, para que la divergencia no reaparezca.

Brecha `SEC-02`: **cerrada**.

---

## 9. Resumen de cobertura

| Métrica | Valor |
|---|---:|
| Rutas construidas por `next build` | 69 |
| Rutas documentadas en este catálogo | **69 (100 %)** |
| Rutas públicas | 15 |
| Rutas guardadas (`/admin` + `/paciente` + `/terapeuta`) | 43 |
| Rutas de sistema | 6 |
| Route Handlers no exportados | 2 |
| Rutas con funcionalidad anunciada pero no implementada | 1 (`/paciente` → «Mensajes») |
| Rutas funcionalmente duplicadas | 4 (§2) |

Ver también: [architecture/routing-and-navigation.md](../architecture/routing-and-navigation.md) · [business/user-journeys.md](../business/user-journeys.md) · [governance/traceability-matrix.md](../governance/traceability-matrix.md)

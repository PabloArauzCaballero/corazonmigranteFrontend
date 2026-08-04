# Matriz de trazabilidad

- **Fecha de evidencia:** 2026-08-03
- **Propósito:** conectar negocio → ruta → componente → API → prueba, en una sola tabla.

---

## 1. Matriz principal

| Capacidad de negocio | Ruta | Componente | Endpoints | Roles | Prueba | Estado |
|---|---|---|---|---|---|---|
| Presentar el proyecto | `/` | `PublicLandingLoader` | `/public/pages/:slug` | — | `public-view-*` (2) + E2E visual | 🟡 Parcial |
| Biblioteca emocional | `/biblioteca`, `/biblioteca/recurso` | `EditorialPublicPage` | `/public/pages/:slug` | — | `editorial-normalizer` | 🟡 Parcial |
| Cursos | `/cursos` | `EditorialPublicPage` | `/public/pages/:slug` | — | `editorial-normalizer` | 🟡 Parcial |
| Páginas CMS dinámicas | `/[slug]` | `EditorialPublicPage` | `listCmsPages()` | — | ❌ | 🔴 |
| Noticias y novedades | `/noticias`, `/novedades` (+ detalle) | `NewsPublicPage`, `NewsDetailFromQuery` | Newsroom público | — | ❌ | 🔴 |
| Textos legales | `/privacidad`, `/terminos` | Estático | — | — | `test:smoke` | 🟢 |
| **Iniciar sesión** | `/login`, `/admin/login` | `LoginForm` | `/auth/login` | Todos | `session.test.ts` (solo normalización) | 🔴 **Insuficiente** |
| **Registrarse** | `/registro` | `RegisterPatientForm` | `/auth/register/patient` | — | ❌ | 🔴 |
| **Reservar cita** | `/booking`, `/paciente/booking` | `BookingAuthWall`, `PatientBookingForm` | `/booking/*`, `/appointments` | `PACIENTE` | ❌ | 🔴 **Crítico** |
| Reservar en nombre de otra persona | `/admin/booking`, `/terapeuta/booking` | `ManagedBookingForm` | `/appointments/admin` | `TERAPEUTA`, `ADMIN`, `SUPER_ADMIN` | ❌ | 🔴 |
| Ver mis citas | `/paciente/citas` | `PatientAppointmentsTable` | `/appointments/mine` | `PACIENTE` | ❌ | 🔴 |
| Agenda del terapeuta | `/terapeuta/agenda` | `TherapistAgendaTable` | `/appointments/mine` | `TERAPEUTA` | ❌ | 🔴 |
| **Definir horarios** | `/terapeuta/horarios` | `TherapistScheduleManager` | `/therapists/me/*` | `TERAPEUTA` | ❌ | 🔴 |
| Gestionar solicitudes | `/admin/solicitudes` | `RequestsTable` | `/appointments/admin/*` | `ADMIN`, `SUPER_ADMIN` | `admin-actions-smoke` | 🟡 |
| Gestionar usuarios | `/admin/usuarios` | `UsersTable` | `/admin/users*` | `ADMIN`, `SUPER_ADMIN` | `admin-actions-smoke` | 🟡 |
| Perfil propio | `/paciente/perfil`, `/terapeuta/perfil` | `*ProfileForm`, `ProfilePhotoUploader` | `/me/*`, `/me/avatar` | `PACIENTE`, `TERAPEUTA` | ❌ | 🔴 |
| Contabilidad | `/admin/contabilidad/*` | `AccountingTable`, `TransactionsTable` | `/admin/accounting/*` | `CONTADOR`, `SUPER_ADMIN` | `other-areas-actions-smoke` | 🟡 |
| Publicar contenido | `/admin/contenido/*` | `newsroom-admin`, `EditorialAdminPage` | `/admin/cms/*` | `ADMIN`, `SUPER_ADMIN` | `editorial-normalizer` | 🟡 |
| Publicidad | `/admin/publicidad/*` | `Ads*Admin`, `AdsPlacementsVisual` | Ads admin | `ADMIN`, `SUPER_ADMIN` | ❌ | 🔴 |
| Catálogo terapéutico | `/admin/productos/*` | `CatalogTable` | `/admin/therapy/*` | `ADMIN`, `SUPER_ADMIN` | `other-areas-actions-smoke` | 🟡 |
| Archivos | `/admin/archivos` | `FilesAdmin` | `/admin/files*` | `ADMIN`, `SUPER_ADMIN` | ❌ | 🔴 |
| Descargables | `/admin/descargables`, `/paciente/descargables` | `DownloadablesAdmin`, `MyDownloadablesLibrary` | Descargables | `ADMIN`+, `PACIENTE` | ❌ | 🔴 |
| Contenido premium | `/paciente/premium` | `PatientPremiumPage` | `/me/news-subscription*`, `/premium/*` | `PACIENTE` | ❌ | 🔴 |
| **Notificaciones** | shell `/admin`, `/admin/notificaciones` | `NotificationBell` | SSE + notificaciones | `ADMIN`, `SUPER_ADMIN`, `CONTADOR` | ❌ | 🔴 |
| **Tutoriales** | `/*/ayuda` + overlay | `TutorialCenter`, `TutorialRun` | — | Todos | **10 suites + E2E** | 🟢 **Completo** |

🟢 cubierto · 🟡 parcial · 🔴 sin cobertura

## 2. Lectura

| Estado | Capacidades | % |
|---|---:|---:|
| 🟢 Completo | 2 | 8 % |
| 🟡 Parcial | 8 | 32 % |
| 🔴 Sin cobertura | 15 | 60 % |

**Las capacidades de mayor valor de negocio son las de menor cobertura.** Reservar una cita —la razón de existir del producto— no tiene ninguna prueba. La única capacidad completamente cubierta es la de tutoriales, que es la de menor valor de negocio y la única que no depende del backend.

Es la evidencia cuantitativa de la brecha `TEST-01`.

## 3. Trazabilidad de componentes compartidos

| Componente | Aristas | Usado por | Prueba |
|---|---:|---|---|
| `humanizeApiError()` | 86 | Todas las features | ❌ |
| `apiRequest()` | 64 | Todos los `*.api.ts` | ✅ `api-client.test.ts` |
| `Button` | 52 | Casi todas las pantallas | ❌ |
| `PageHeader()` | 42 | Casi todas las pantallas de portal | ❌ |
| `isRecord()` | 44 | Normalizadores | ✅ `normalizers.test.ts` |
| `Card` / `CardContent` | 37 / 37 | Toda la interfaz | ❌ |
| `normalizePaginatedResponse()` | 34 | Todas las tablas | ✅ `normalizers.test.ts` |
| `SmartImage` | — | Landing y contenido público | ✅ `smart-image.test.tsx` |
| `Modal` | — | Todos los diálogos | ❌ **Riesgo alto** |
| `DataTable` | — | Todas las tablas | ❌ |

**Patrón:** lo que está en `shared/api` sí tiene prueba; lo que está en `shared/ui` no, salvo `SmartImage`. Brecha `TEST-02`.

## 4. Trazabilidad de riesgos

| Riesgo | Documento | Componente afectado |
|---|---|---|
| `SEC-01` JWT en query string SSE | [security/threat-model.md](../security/threat-model.md) | `use-admin-notifications.ts` |
| `SEC-02` Divergencia de roles | [routes/route-catalog.md §8](../routes/route-catalog.md) | `middleware.ts` vs `guard.tsx` |
| `SEC-03` JWT en `localStorage` | [security/browser-storage.md](../security/browser-storage.md) | `cookies.ts` |
| `SEC-05` `?next=` sin validar | [security/frontend-security.md](../security/frontend-security.md) | `guard.tsx`, `client.ts` |
| `OPS-01` Variables de CI obsoletas | [operations/deployment.md](../operations/deployment.md) | `.github/workflows/ci.yml` |
| `OPS-02` CI sube `.next/` en vez de `out/` | [operations/deployment.md](../operations/deployment.md) | `.github/workflows/ci.yml` |
| `API-02` Sin OpenAPI ni tipos generados | [integrations/backend-api.md](../integrations/backend-api.md) | Todos los `*.api.ts` |
| `A11Y-01` Sin pruebas de accesibilidad | [accessibility/audit-report.md](../accessibility/audit-report.md) | `shared/ui/*` |
| `PERF-02` Web Vitals sin panel | [performance/monitoring.md](../performance/monitoring.md) | `use-web-vitals.ts` |

## 5. Mantenimiento

Esta matriz debe actualizarse al añadir una ruta, una capacidad, un componente compartido, un endpoint o una prueba. Ver [change-management.md](change-management.md).

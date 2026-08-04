# Inventario funcional del frontend

- **Fecha de evidencia:** 2026-08-03
- **Naturaleza:** `DOCUMENTAL`

Fotografía verificable de lo que existe en el frontend. Todo lo listado está comprobado en el árbol del repositorio; lo que no existe se marca explícitamente como ausente.

---

## 1. Features de negocio

17 carpetas bajo [src/features/](../../src/features/). Cada una agrupa componentes de UI y su cliente API (`*.api.ts`).

| Feature | Responsabilidad | Rutas que la consumen | Cliente API propio |
|---|---|---|---|
| `auth` | Login y registro de paciente | `/login`, `/admin/login`, `/registro` | ✅ `auth.api.ts` |
| `booking` | Reserva de citas (paciente, gestionada, muro público) | `/booking`, `/paciente/booking`, `/admin/booking`, `/terapeuta/booking` | ✅ `booking.api.ts` |
| `therapy` | Citas, solicitudes, agenda y horarios | `/admin/solicitudes`, `/paciente/citas`, `/terapeuta/agenda`, `/terapeuta/horarios` | ✅ `therapy.api.ts` |
| `users` | Gestión de usuarios (admin) | `/admin/usuarios` | ✅ `users.api.ts` |
| `profile` | Perfiles de paciente y terapeuta | `/paciente/perfil`, `/terapeuta/perfil` | — (usa `users.api.ts`) |
| `dashboard` | Shell de portal, navegación lateral, tarjetas de resumen | Los tres portales privados | — |
| `accounting` | Contabilidad: cuentas, grupos, centros de costo, transacciones | `/admin/contabilidad/*` | ✅ `accounting.api.ts` |
| `newsroom` | Publicaciones, taxonomía, suscriptores, publicidad, premium | `/noticias`, `/novedades`, `/admin/contenido/*`, `/admin/publicidad/*`, `/paciente/premium` | ✅ `newsroom.api.ts` |
| `editorial` | Biblioteca y páginas CMS públicas | `/biblioteca`, `/cursos`, `/[slug]`, `/admin/contenido/editorial` | ✅ `editorial.api.ts` |
| `public-view` | Landing configurable (v2) y previsualización admin | `/`, `/admin/vistas-publicas` | ✅ `public-view.api.ts` |
| `public-content` | Tabla de páginas públicas | `/admin/contenido/paginas`, `/admin/vistas-publicas` | — |
| `landing` | Shell público (navbar + footer) | Todas las rutas del grupo `(public)` | — |
| `files` | Gestión de archivos y subida a Cloudinary | `/admin/archivos` | ✅ vía `shared/api/files.ts` |
| `downloadables` | Descargables y biblioteca personal | `/admin/descargables`, `/paciente/descargables` | ✅ `downloadables.api.ts` |
| `products` | Catálogo terapéutico: enfoques y servicios | `/admin/productos/*` | ✅ `products.api.ts` |
| `notifications` | Campana, listado y stream SSE | `/admin/notificaciones` + shell admin | ✅ `notifications.api.ts` |
| `tutorial` | Motor de tutoriales guiados y centro de ayuda | `/admin/ayuda`, `/paciente/ayuda`, `/terapeuta/ayuda` + overlay global | — (progreso local) |

---

## 2. Componentes compartidos

19 archivos en [src/shared/ui/](../../src/shared/ui/). Detalle completo en [components/catalog.md](../components/catalog.md).

| Familia | Componentes |
|---|---|
| Acción | `button.tsx` |
| Contenedores | `card.tsx`, `page-header.tsx`, `table-shell.tsx`, `auth-visual-layout.tsx` |
| Formularios | `input.tsx`, `label.tsx`, `textarea.tsx`, `password-input.tsx` |
| Datos | `data-table.tsx` |
| Superposiciones | `modal.tsx`, `confirm-dialog.tsx` |
| Notificación | `toast.tsx`, `global-loading-bar.tsx` |
| Estados | `state.tsx` (carga, vacío, error, prohibido), `error-boundary.tsx` |
| Presentación | `badge.tsx`, `smart-image.tsx`, `fontawesome.tsx` |

## 3. Capa compartida no visual

| Módulo | Archivos | Contenido |
|---|---|---|
| [shared/api/](../../src/shared/api/) | `client.ts`, `endpoints.ts`, `errors.ts`, `normalizers.ts`, `files.ts`, `common.ts` | Cliente HTTP, registro de endpoints, traducción de errores, normalizadores |
| [shared/auth/](../../src/shared/auth/) | `roles.ts`, `session.ts`, `cookies.ts`, `guard.tsx`, `use-session.tsx` | RBAC, normalización de sesión, persistencia, guard de rutas |
| [shared/hooks/](../../src/shared/hooks/) | `use-media-query.ts` | Consulta de breakpoints |
| [observability/](../../src/observability/) | 28 archivos en `browser/`, `config/`, `core/`, `react/` | OpenTelemetry: trazas, atributos, saneado, Web Vitals, errores |

---

## 4. Providers globales

Orden real de anidamiento en [src/app/providers.tsx](../../src/app/providers.tsx):

```
QueryClientProvider          (React Query: retry 1, staleTime 30 s)
└── SessionProvider          (sesión normalizada desde localStorage)
    ├── TelemetryProvider    (no renderiza; conecta telemetría al ciclo de React)
    ├── GlobalLoadingBar
    └── ToastProvider
        └── ConfirmProvider
            └── TutorialProvider
                └── children
```

El orden es significativo: `TelemetryProvider` va dentro de `SessionProvider` porque necesita el rol para el segmento de usuario, y antes que el resto para no perder ninguna navegación.

---

## 5. Estados de interfaz disponibles

Provistos de forma centralizada por [shared/ui/state.tsx](../../src/shared/ui/state.tsx):

| Estado | Componente | Uso verificado |
|---|---|---|
| Carga | `LoadingState` | `ClientRoleGuard` («Verificando sesión», «Redirigiendo al inicio de sesión») |
| Error | `ErrorState` | Tablas y páginas de datos |
| Prohibido | `ForbiddenState` | `ClientRoleGuard` con rol insuficiente; `/403` |
| Vacío | Estado vacío | Tablas sin resultados |
| Carga de ruta | `loading.tsx` | 8 rutas: `biblioteca`, `booking`, `cursos`, `noticias`, `novedades`, `admin/contabilidad`, `admin/contenido`, `admin/publicidad`, `admin/usuarios`, `paciente`, `terapeuta` |
| Progreso global | `GlobalLoadingBar` | Montado en `AppProviders` |

Detalle por pantalla en [components/catalog.md](../components/catalog.md) y [business/user-journeys.md](../business/user-journeys.md).

---

## 6. Fronteras de error

| Archivo | Alcance |
|---|---|
| [app/global-error.tsx](../../src/app/global-error.tsx) | Fallo del layout raíz |
| [app/(public)/error.tsx](../../src/app/(public)/error.tsx) | Rutas públicas |
| [app/admin/error.tsx](../../src/app/admin/error.tsx) | Portal admin |
| [app/paciente/error.tsx](../../src/app/paciente/error.tsx) | Portal paciente |
| [app/terapeuta/error.tsx](../../src/app/terapeuta/error.tsx) | Portal terapeuta |
| [shared/ui/error-boundary.tsx](../../src/shared/ui/error-boundary.tsx) | Frontera de componente reutilizable |
| [observability/react/telemetry-boundary.tsx](../../src/observability/react/telemetry-boundary.tsx) | Frontera que además reporta a telemetría |

Ver [architecture/error-boundaries.md](../architecture/error-boundaries.md).

---

## 7. Scripts operativos

| Script | Propósito | ¿Toca red? |
|---|---|---|
| [scripts/dev-auto-port.mjs](../../scripts/dev-auto-port.mjs) | Arranca `next dev` buscando puerto libre (preferido 4173) | No |
| [scripts/start.mjs](../../scripts/start.mjs) | Arranque de producción | No |
| [scripts/check-public-endpoints.mjs](../../scripts/check-public-endpoints.mjs) | Comprueba endpoints públicos reales | **Sí** |
| [scripts/audit-media-assets.mjs](../../scripts/audit-media-assets.mjs) | Audita assets de medios | Depende |
| `scripts/upload-landing-cloudinary.mjs` | Subida a Cloudinary — **ignorado por git** (movido al backend) | Sí |

---

## 8. Lo que NO existe

Registrado explícitamente para que nadie documente capacidades inexistentes:

| Elemento | Estado | Consecuencia |
|---|---|---|
| Internacionalización (i18n) | ❌ No existe | Textos en español incrustados. `<html lang="es">` fijo |
| Modo oscuro | ❌ No activo | `darkMode: ["class"]` configurado en Tailwind, pero **ninguna clase `dark` se aplica**; `colorScheme: "light"` fijo en el viewport. Registrado en `pending-items.md` como `PENDIENTE_CM_MODO_OSCURO` |
| Storybook | ❌ No existe | El catálogo de componentes es documental. Ver [components/catalog.md](../components/catalog.md) |
| Mensajería paciente–terapeuta | ❌ No implementada | Anunciada en la UI de `/paciente` como «Pendiente de activar» |
| Refresh token automático | ❌ No implementado | `ENDPOINTS.auth.refresh` está declarado pero no se invoca. Un 401 cierra sesión |
| Sincronización remota de tutoriales | ⚠️ Bajo bandera apagada | `NEXT_PUBLIC_TUTORIALS_REMOTE_PROGRESS=false`; el endpoint `/me/tutorials/progress` aún no existe en el backend |
| Pruebas de accesibilidad automatizadas | ❌ No existen | Sin `axe`, `jest-axe` ni `@axe-core/playwright` |
| Análisis de bundle | ❌ No instalado | Sin `@next/bundle-analyzer`. La medición es la salida de `next build` |
| Umbral de cobertura | ❌ No configurado | `jest.config.mjs` no define `coverageThreshold` |
| Captura de errores en producción (Sentry o similar) | ❌ No existe | Los errores viajan como *spans* OTLP. Ver [observability/error-reporting.md](../observability/error-reporting.md) |
| Feature flags con plataforma | ❌ No existe | La única bandera es la variable de entorno de tutoriales |

---

## 9. Resumen cuantitativo

| Métrica | Valor |
|---|---:|
| Rutas construidas | 69 |
| Archivos `page.tsx` | 60 |
| Layouts | 5 |
| Fronteras de error | 7 |
| Features de negocio | 17 |
| Componentes compartidos de UI | 19 |
| Clientes API por feature | 11 |
| Archivos de observabilidad | 28 |
| Providers globales | 6 |
| Suites de prueba unitaria | 22 (182 pruebas) |
| Specs E2E | 2 |
| Endpoints registrados en `ENDPOINTS` | ~110 en 13 grupos |

# Routing y navegación

- **Fecha de evidencia:** 2026-08-03
- **Catálogo completo de rutas:** [routes/route-catalog.md](../routes/route-catalog.md)

---

## 1. Estructura del App Router

```
src/app/
├── layout.tsx                 Raíz: <html lang="es">, fuentes, skip-link, AppProviders
├── page.tsx                   /  → PublicLandingLoader
├── not-found.tsx              404
├── global-error.tsx           Fallo del layout raíz
├── 403/page.tsx               Destino del rewrite del middleware (inactivo)
├── manifest.ts · robots.ts · sitemap.ts
│
├── (public)/                  Grupo sin segmento de URL
│   ├── layout.tsx             → PublicShell (navbar + footer)
│   ├── error.tsx
│   ├── login · admin/login · registro
│   ├── biblioteca · biblioteca/recurso · cursos
│   ├── noticias · noticias/detalle · novedades · novedades/detalle
│   ├── booking · privacidad · terminos
│   └── [slug]/                SSG con generateStaticParams
│
├── admin/                     ClientRoleGuard ADMIN · SUPER_ADMIN · CONTADOR
├── paciente/                  ClientRoleGuard PACIENTE
├── terapeuta/                 ClientRoleGuard TERAPEUTA
└── api/                       Route Handlers — NO se exportan
```

El grupo `(public)` no añade segmento a la URL: existe únicamente para compartir `PublicShell` y una frontera de error entre las rutas públicas.

**`/admin/login` está dentro de `(public)`**, no de `admin/`. Es intencional: si estuviera bajo el layout guardado, nadie podría llegar a iniciar sesión.

---

## 2. Las dos capas de protección

### Capa activa — `ClientRoleGuard`

[src/shared/auth/guard.tsx](../../src/shared/auth/guard.tsx), aplicado en los tres layouts privados.

```tsx
export function ClientRoleGuard({ allowedRoles, loginPath, children }) {
  const { session, isReady } = useSession();

  useEffect(() => {
    if (!isReady || session) return;
    const next = pathname && pathname !== loginPath ? `?next=${encodeURIComponent(pathname)}` : "";
    router.replace(`${loginPath}${next}`);
  }, [isReady, loginPath, pathname, router, session]);

  if (!isReady)  return <LoadingState title="Verificando sesión" />;
  if (!session)  return <LoadingState title="Redirigiendo al inicio de sesión" />;
  if (!hasRole(session.role, allowedRoles)) return <ForbiddenState />;
  return <>{children}</>;
}
```

| Situación | Resultado |
|---|---|
| Sesión aún no leída (`isReady === false`) | `LoadingState` «Verificando sesión» |
| Sin sesión | `router.replace(loginPath + ?next=<ruta>)` |
| Sesión con rol no permitido | `ForbiddenState` **en la misma URL** (no redirige a `/403`) |
| Sesión con rol permitido | Renderiza `children` |

El parámetro `?next=` preserva el destino para volver a él tras autenticarse.

### Capa inerte — `middleware.ts`

[middleware.ts](../../middleware.ts) **no se ejecuta**: `output: "export"` elimina el runtime de servidor. Se conserva por dos razones que el propio archivo declara: seguiría siendo la protección real si se migrara a un despliegue con servidor, y documenta en un solo sitio el mapa ruta → roles.

**Divergencia registrada:** el middleware admite `TERAPEUTA` en `/admin`; el guard no. Detalle e impacto en [routes/route-catalog.md §8](../routes/route-catalog.md). Brecha `SEC-02`.

---

## 3. Navegación tras iniciar sesión

`dashboardForRole()` en [shared/auth/roles.ts](../../src/shared/auth/roles.ts):

| Rol | Destino |
|---|---|
| `PACIENTE` | `/paciente` |
| `TERAPEUTA` | `/terapeuta` |
| `CONTADOR` | `/admin/contabilidad` |
| `ADMIN`, `SUPER_ADMIN` | `/admin` |

`CONTADOR` entra directamente en contabilidad, aunque el guard le permita todo `/admin`: sus permisos (`admin:read`, `accounting:*`, `profile:*`) no incluyen `users:manage` ni `therapy:manage`. La UI oculta lo que no le corresponde; **el backend es quien lo impide de verdad**.

---

## 4. Expulsión por sesión caducada

Dos mecanismos complementarios, ambos activos:

**a) Al leer la sesión** — `readClientSession()` en [cookies.ts](../../src/shared/auth/cookies.ts) decodifica la marca `exp` del JWT (sin validar firma, con margen de 15 s) y descarta la sesión si ya caducó.

**b) Ante un `401`** — `handleUnauthorizedSession()` en [client.ts](../../src/shared/api/client.ts):

```ts
startSpan(BUSINESS_SPANS.authSessionExpired, { feature: "auth", operation: "session-expired" }).end();
clearClientSession();
const loginPath = currentPath.startsWith("/admin") ? "/admin/login" : "/login";
window.location.replace(`${loginPath}?next=${encodeURIComponent(currentPath)}`);
```

Sin (b), alguien con token expirado quedaría atrapado en una pantalla que dispara `401` en bucle: el guard solo comprueba el **rol**, no la **vigencia** del token.

---

## 5. Navegación visible

| Superficie | Definición | Contenido |
|---|---|---|
| Navbar público | `PublicShell` en [features/landing/public-shell.tsx](../../src/features/landing/public-shell.tsx) | Rutas públicas + acceso |
| Barra lateral de portal | `DashboardShell` con `adminNav`, `patientNav`, `therapistNav` en [features/dashboard/sidebar.tsx](../../src/features/dashboard/sidebar.tsx) | Navegación por rol |
| Campana de notificaciones | `DashboardShell` con `showNotifications` — **solo en el layout admin** | Contador + stream SSE |
| Índices de sección | `/admin/contabilidad`, `/admin/publicidad` | Tarjetas hacia subrutas |
| Enlace de salto | `.skip-link` en el layout raíz | Primer control enfocable de cada página |

---

## 6. Estado en la URL

Con `output: "export"` no hay segmentos dinámicos servidos bajo demanda, así que la aplicación usa *query strings* donde otra arquitectura usaría rutas anidadas:

| Ruta | Parámetro | Uso |
|---|---|---|
| `/noticias/detalle`, `/novedades/detalle` | identificador de publicación | `NewsDetailFromQuery`, envuelto en `Suspense` |
| `/biblioteca/recurso` | identificador de recurso | `EditorialResourceQueryPage` |
| `/login`, `/admin/login` | `?next=` | Destino tras autenticarse |

El `Suspense` alrededor de los componentes que leen `searchParams` es obligatorio en el App Router; sin él el build falla.

---

## 7. Reglas para añadir una ruta nueva

1. Si es **privada**, colócala bajo `admin/`, `paciente/` o `terapeuta/` para heredar el `ClientRoleGuard`. Una ruta privada fuera de esos árboles **queda sin protección alguna**.
2. Actualiza también `protectedRoutes` en `middleware.ts` — el propio archivo lo exige, aunque hoy sea inerte.
3. Define `metadata` con `robots: { index: false, follow: false }` si es privada, y añade el prefijo a [public/_headers](../../public/_headers) si es un árbol nuevo.
4. Registra la ruta en [routes/route-catalog.md](../routes/route-catalog.md) y en [governance/traceability-matrix.md](../governance/traceability-matrix.md).
5. Si la ruta debe aparecer en tutoriales, añádela a [`APP_ROUTES`](../../src/features/tutorial/model/app-routes.ts): `tests/unit/tutorial-app-routes.test.ts` valida la coherencia.
6. Ejecuta `yarn test:smoke`, que comprueba la existencia de rutas y documentación críticas.

# Gestión de estado

- **Fecha de evidencia:** 2026-08-03

La aplicación distingue **cuatro tipos de estado**. La distinción no es teórica: cada uno tiene un mecanismo, un ciclo de vida y una política de persistencia distintos.

| Tipo | Mecanismo | Vive en | Sobrevive a recarga |
|---|---|---|---|
| Estado de servidor | React Query | Memoria del cliente | ❌ |
| Estado de cliente global | React Context | Memoria de React | ❌ (salvo sesión) |
| Estado de URL | `searchParams` | La barra de direcciones | ✅ |
| Estado de formulario | `react-hook-form` | El componente | ❌ |

---

## 1. Estado de servidor — React Query

Configuración única en [app/providers.tsx](../../src/app/providers.tsx):

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000
    }
  }
})
```

| Opción | Valor | Consecuencia |
|---|---|---|
| `retry` | `1` | Un reintento ante fallo. Con `retry: 3` (el valor por defecto de la librería), un backend caído multiplicaría por cuatro la carga y retrasaría el mensaje de error |
| `staleTime` | `30 000 ms` | Durante 30 s los datos se consideran frescos y no se refetchean al volver a montar o enfocar la ventana |

**No se configuran** `gcTime`, `refetchOnWindowFocus` ni `refetchInterval`: rigen los valores por defecto de TanStack Query v5.

El `QueryClient` se crea con `useState(() => new QueryClient(...))`, no como constante de módulo. Es lo correcto: una constante de módulo compartiría caché entre renders del servidor en un despliegue con servidor.

### Claves de consulta

No existe una fábrica centralizada de claves. Cada feature define las suyas. Ejemplo verificable:

```ts
// features/notifications/use-admin-notifications.ts
const UNREAD_COUNT_KEY = ["admin-unread-count"] as const;
```

Esta clave se comparte deliberadamente entre la campana de escritorio y la de móvil. El comentario del código explica el porqué: antes eran dos `useState` con carga inicial propia que hacían **dos peticiones** y provocaban un render en cascada.

Detalle en [data-and-state/server-state.md](../data-and-state/server-state.md) y [data-and-state/invalidation.md](../data-and-state/invalidation.md).

---

## 2. Estado de cliente global — Contexts

Cinco contexts, todos montados en `AppProviders`:

| Context | Archivo | Estado que guarda | Persistencia |
|---|---|---|---|
| `SessionContext` | [shared/auth/use-session.tsx](../../src/shared/auth/use-session.tsx) | `session`, `isReady` | ✅ `localStorage` + cookie de rol |
| `ToastContext` | [shared/ui/toast.tsx](../../src/shared/ui/toast.tsx) | Cola de notificaciones efímeras | ❌ |
| `ConfirmContext` | [shared/ui/confirm-dialog.tsx](../../src/shared/ui/confirm-dialog.tsx) | Diálogo de confirmación pendiente | ❌ |
| `TutorialProvider` | [features/tutorial/ui/tutorial-provider.tsx](../../src/features/tutorial/ui/tutorial-provider.tsx) | Recorrido activo y paso actual | ✅ progreso en `localStorage` |
| `TelemetryProvider` | [observability/react/telemetry-provider.tsx](../../src/observability/react/telemetry-provider.tsx) | No renderiza; conecta navegación y Web Vitals | ❌ |

### `SessionProvider` en detalle

```ts
useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setSessionState(readClientSession());
  setIsReady(true);
}, []);
```

La lectura de `localStorage` **debe** ocurrir en un efecto, no en un inicializador de `useState`. El HTML se generó en build, donde `window` no existe; leerlo durante el primer render provocaría un *mismatch* de hidratación. El `eslint-disable` está justificado con un comentario en el propio archivo.

`isReady` es la razón por la que `ClientRoleGuard` muestra «Verificando sesión» antes de decidir: sin ese estado intermedio, el guard expulsaría al login a todo el mundo en el primer render.

`logout()` hace tres cosas: emite un span de negocio `auth.logout`, limpia la sesión y **rota el identificador de sesión de telemetría**, para que las trazas de quien entre después en el mismo navegador no se agrupen con las de quien acaba de salir.

---

## 3. Estado de URL

| Ruta | Parámetro | Lectura |
|---|---|---|
| `/noticias/detalle`, `/novedades/detalle` | identificador de publicación | `NewsDetailFromQuery` dentro de `Suspense` |
| `/biblioteca/recurso` | identificador de recurso | `EditorialResourceQueryPage` |
| `/login`, `/admin/login` | `?next=` | Destino tras autenticarse |

Con `output: "export"` no hay segmentos dinámicos servidos bajo demanda, de ahí el uso de *query strings* donde otra arquitectura usaría rutas anidadas. Todo componente que lea `searchParams` **debe** ir envuelto en `Suspense`, o el build falla.

---

## 4. Estado de formulario

`react-hook-form` + `zod` mediante `@hookform/resolvers`. Formularios verificados: login, registro de paciente, perfil de paciente, perfil de terapeuta, reserva (tres variantes), creación de usuario, entidades contables, catálogo de productos, elementos CMS.

Ver [data-and-state/forms-and-validation.md](../data-and-state/forms-and-validation.md).

---

## 5. Datos sensibles en almacenamiento del navegador

| Clave | Almacén | Contenido | Riesgo |
|---|---|---|---|
| `cm_session` | `localStorage` | JSON con `userId`, `fullName`, `email`, `role`, `permissions` y **el JWT** | **Alto** — accesible a cualquier script del origen |
| `cm_session_role` | Cookie (`SameSite=Lax`, `Secure` solo en HTTPS) | Solo el rol | Bajo — no es un secreto |
| Progreso de tutoriales | `localStorage` | Identificadores de tutorial y paso | Bajo |
| Identificador de sesión de telemetría | Ver [observability/core/session-id.ts](../../src/observability/core/session-id.ts) | Identificador aleatorio, rotado al cerrar sesión | Bajo |

La cookie de rol **no lleva `HttpOnly`** — a propósito: `middleware.ts` la leería en un despliegue con servidor, y en el actual la escribe JavaScript. No contiene el token.

**No es posible usar cookies `HttpOnly` para el JWT en esta arquitectura**: no hay servidor de aplicación que las emita. Es una consecuencia aceptada de [ADR-0002](../adr/ADR-0002-exportacion-estatica.md), no un descuido. Ver [security/browser-storage.md](../security/browser-storage.md).

---

## 6. Lo que no existe

| Elemento | Estado |
|---|---|
| Store global (Redux, Zustand, Jotai) | ❌ No se usa ninguno |
| Actualizaciones optimistas | ❌ No se detectó ninguna. Ver [data-and-state/optimistic-updates.md](../data-and-state/optimistic-updates.md) |
| Persistencia de la caché de React Query | ❌ Sin `persistQueryClient` |
| Fábrica centralizada de claves de consulta | ❌ Cada feature define las suyas |
| Rehidratación de estado de servidor | ❌ No aplica: no hay SSR con datos |

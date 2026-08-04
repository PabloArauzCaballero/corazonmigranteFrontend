# Estado de servidor

- **Fecha de evidencia:** 2026-08-03
- **Herramienta:** `@tanstack/react-query` `^5.90.12`

## 1. Configuración única

[app/providers.tsx](../../src/app/providers.tsx):

```ts
const [queryClient] = useState(() => new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } }
}));
```

| Opción | Valor | Frente al defecto |
|---|---|---|
| `retry` | `1` | El defecto es `3`: con el backend caído **cuadruplicaría** la carga y retrasaría el error |
| `staleTime` | `30 000 ms` | El defecto es `0`: refetchearía al remontar y al enfocar la ventana |

No se configuran `gcTime`, `refetchOnWindowFocus` ni `refetchInterval`: rigen los valores por defecto de v5.

**El `QueryClient` se crea con `useState(() => …)`**, no como constante de módulo. Es lo correcto: una constante compartiría caché entre renders en un despliegue con servidor.

## 2. Claves de consulta

No hay fábrica centralizada. Cada feature define las suyas.

Ejemplo verificable:

```ts
// features/notifications/use-admin-notifications.ts
const UNREAD_COUNT_KEY = ["admin-unread-count"] as const;
```

Esta clave se comparte **deliberadamente** entre la campana de escritorio y la de móvil. El comentario del código explica el antes:

> *«El contador vive en React Query en vez de en useState + useEffect de carga inicial: así se comparte entre la campana del escritorio y la del móvil (que antes hacían dos peticiones), y desaparece el render en cascada del efecto.»*

Es el argumento más claro a favor de React Query en este proyecto: **una clave compartida elimina una petición duplicada y un render en cascada.**

### El riesgo de no tener fábrica

Sin convención central, dos features pueden usar claves parecidas o invalidar de forma incompleta. Con ~15 claves es manejable; si crece, convendría una fábrica por dominio. Registrado como observación, no como brecha.

## 3. Patrón de uso

```ts
// features/<dominio>/<dominio>.api.ts
export async function listSomething(): Promise<Something[]> {
  const payload = await apiRequest<unknown>(ENDPOINTS.dominio.list);
  return normalizePaginatedResponse<Something>(payload).items;
}

// componente
const query = useQuery({ queryKey: ["dominio", "list"], queryFn: listSomething });
```

El componente recibe `{ data, isLoading, isError }` y los traduce a `DataTableSkeleton`, `DataTable` o `ErrorState`.

`DataTable` acepta `data` como `undefined` o `null` y lo normaliza a `[]`, de modo que se le puede pasar `query.data` sin comprobaciones previas.

## 4. Casos particulares

### Contador de no leídas — fallo silencioso deliberado

```ts
const countQuery = useQuery({
  queryKey: UNREAD_COUNT_KEY,
  queryFn: getUnreadCount,
  retry: false,        // ← anula el retry: 1 global
  staleTime: 30_000,
});
const unreadCount = countQuery.data?.unreadCount ?? 0;
```

Comentario del código: *«El badge no es crítico: si la petición falla se muestra 0 en silencio.»*

Es una decisión correcta: un badge de notificaciones que muestra un error es peor que uno que muestra cero.

### Actualización manual de la caché

```ts
queryClient.setQueryData<{ unreadCount: number }>(UNREAD_COUNT_KEY, (previous) => ({
  unreadCount: Math.max(0, update(previous?.unreadCount ?? 0)),
}));
```

Al llegar un mensaje SSE se incrementa el contador **sin volver a pedirlo**. El `Math.max(0, …)` evita contadores negativos si llegan más marcas de leído que notificaciones.

## 5. Lo que no se usa

| Capacidad | Estado |
|---|---|
| Actualizaciones optimistas | ❌ Ninguna detectada. Ver [optimistic-updates.md](optimistic-updates.md) |
| Persistencia de la caché | ❌ Sin `persistQueryClient` |
| Consultas infinitas | ❌ Se usa paginación clásica |
| Prefetching | ❌ |
| Suspense de React Query | ❌ |
| Rehidratación desde servidor | ❌ No aplica: no hay SSR con datos |

**La ausencia de persistencia es una propiedad de privacidad valiosa**: ningún dato de paciente queda en disco. Ver [../security/privacy.md §2](../security/privacy.md).

## 6. Limitación heredada del cliente HTTP

`apiRequest()` **no define timeout** ni propaga `AbortSignal`. React Query gestiona reintentos y caché, pero no puede cancelar una petición que nunca responde si el cliente no lo permite.

Consecuencia: un backend que acepta la conexión y no responde deja la consulta en carga indefinida. Brechas `API-03` y `API-04`. Ver [../integrations/backend-api.md §2](../integrations/backend-api.md).

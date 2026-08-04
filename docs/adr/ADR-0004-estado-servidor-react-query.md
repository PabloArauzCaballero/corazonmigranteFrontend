# ADR-0004: React Query para el estado de servidor

## Estado

**Aceptado** — estado observado el 2026-08-03.

## Contexto

Con `output: "export"` no hay renderizado en servidor con datos: **todo el fetch ocurre en el navegador**, tras la hidratación. Hacía falta gestionar caché, estados de carga y error, y evitar peticiones duplicadas.

## Decisión

`@tanstack/react-query` v5, con configuración única en [providers.tsx](../../src/app/providers.tsx):

```ts
new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } })
```

## Opciones consideradas

| Opción | Descartada porque |
|---|---|
| **React Query** (elegida) | — |
| `useState` + `useEffect` a mano | Es exactamente lo que se eliminó en `useAdminNotifications`: producía **dos peticiones** y un render en cascada |
| SWR | Equivalente; React Query ofrece mejor gestión de mutaciones |
| Redux Toolkit Query | Requiere adoptar Redux, que el proyecto no usa |

## Los dos parámetros, justificados

| Parámetro | Valor | Frente al valor por defecto |
|---|---|---|
| `retry` | `1` | El defecto es `3`. Con un backend caído, `3` **cuadruplicaría** la carga y retrasaría el mensaje de error |
| `staleTime` | `30 000 ms` | El defecto es `0`, que refetchea al remontar y al enfocar la ventana |

Ambos están afinados hacia el mismo objetivo: **no castigar a un backend que ya está sufriendo** y no gastar red innecesariamente.

## Consecuencias positivas

- Estados de carga y error uniformes en toda la aplicación.
- Caché compartida por clave: la campana de escritorio y la de móvil comparten `["admin-unread-count"]` y hacen **una sola petición**.
- Invalidación explícita tras mutaciones.
- El `QueryClient` se crea con `useState(() => …)`, no como constante de módulo — correcto para evitar compartir caché entre renders.

## Consecuencias negativas

- **La caché no se persiste**: se pierde al recargar. Toda pantalla privada vuelve a pedir datos en cada carga.
- **No hay fábrica centralizada de claves**: cada feature define las suyas, con riesgo de colisión o de invalidación incompleta.
- **No se usan actualizaciones optimistas** en ninguna mutación: cada acción espera al servidor.

La ausencia de persistencia es, en realidad, **una propiedad de privacidad valiosa**: ningún dato de paciente queda en disco. Ver [security/privacy.md §2](../security/privacy.md).

## Riesgos

| Riesgo | Severidad |
|---|---|
| Claves duplicadas o inconsistentes entre features | LOW |
| Invalidación olvidada tras una mutación → datos obsoletos en pantalla | MEDIUM |
| Sin timeout en `apiRequest()`, una consulta puede quedar cargando indefinidamente (`API-03`) | MEDIUM |

El tercero es el más relevante: React Query gestiona reintentos y caché, pero **no puede cancelar una petición que nunca responde** si el cliente HTTP no define timeout.

## Evidencia

- [providers.tsx](../../src/app/providers.tsx)
- [use-admin-notifications.ts](../../src/features/notifications/use-admin-notifications.ts) — comentario sobre las dos peticiones eliminadas
- `package.json` — `@tanstack/react-query: ^5.90.12`

## Plan de revisión

Revisar si: se necesita trabajo sin conexión (exigiría persistencia), las claves crecen hasta requerir una fábrica centralizada, o se decide adoptar actualizaciones optimistas en las mutaciones frecuentes.

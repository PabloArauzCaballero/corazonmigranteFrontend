# Invalidación de caché

- **Fecha de evidencia:** 2026-08-03

## 1. Los tres mecanismos en uso

### a) `staleTime` — invalidación por tiempo

30 segundos globales. Pasado ese plazo, React Query refetchea al remontar o al enfocar la ventana.

Es el mecanismo pasivo: cubre el caso de datos que cambian por acción de **otra persona**.

### b) `invalidateQueries()` — invalidación explícita

```ts
const refreshCount = useCallback(async () => {
  await queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
}, [queryClient]);
```

Se usa tras mutaciones. Marca la consulta como obsoleta y la vuelve a pedir si está montada.

### c) `setQueryData()` — actualización directa

```ts
queryClient.setQueryData<{ unreadCount: number }>(UNREAD_COUNT_KEY, (previous) => ({
  unreadCount: Math.max(0, update(previous?.unreadCount ?? 0)),
}));
```

Escribe el valor **sin pedirlo al servidor**. Se usa al recibir un mensaje SSE: ya se sabe que hay una notificación más, no hace falta preguntar.

## 2. Cuándo usar cada uno

| Situación | Mecanismo |
|---|---|
| Los datos pueden haber cambiado por acción de otra persona | `staleTime` |
| Acabo de crear, editar o borrar algo | `invalidateQueries()` |
| Ya conozco el valor nuevo con certeza | `setQueryData()` |
| Llega un evento en tiempo real | `setQueryData()` |

`setQueryData()` es el más eficiente y el más arriesgado: si el valor calculado no coincide con el del servidor, la interfaz miente hasta la siguiente invalidación. Por eso el contador usa `Math.max(0, …)` — evita mostrar un número negativo si llegan más marcas de leído que notificaciones.

## 3. El riesgo real

**No existe una convención que garantice que toda mutación invalide lo que corresponde.**

Al no haber fábrica centralizada de claves ni patrón obligatorio de `onSuccess`, la invalidación depende de que quien escribe cada mutación se acuerde. Es el modo de fallo más probable de esta capa:

> Se crea un registro, la petición tiene éxito, y la tabla sigue mostrando la lista anterior durante 30 segundos.

No rompe nada, no produce error, y la persona usuaria concluye que «no se guardó» y lo intenta otra vez.

Registrado como observación. Una convención (`onSuccess: () => queryClient.invalidateQueries({ queryKey: [dominio] })` en toda mutación) lo cerraría, pero sería `CAMBIO DE PRODUCTO`.

## 4. Invalidación por jerarquía de claves

React Query invalida por prefijo. Con claves estructuradas jerárquicamente:

```ts
["usuarios"]              // todo el dominio
["usuarios", "list"]      // solo la lista
["usuarios", "detalle", id]
```

`invalidateQueries({ queryKey: ["usuarios"] })` invalidaría las tres.

**Esta convención no está establecida en el proyecto**: las claves existentes son planas (`["admin-unread-count"]`). Adoptarla facilitaría la invalidación correcta, y es la razón principal para introducir una fábrica de claves si el número crece.

## 5. Lo que no se invalida nunca

| Dato | Motivo |
|---|---|
| Sesión | No está en React Query; vive en Context + `localStorage` |
| Progreso de tutoriales | `localStorage`, con su propia capa de almacenamiento |
| Configuración de entorno | Incrustada en build |
| Contenido CMS prerenderizado | **Requiere reconstruir** — ver [../operations/cache-and-cdn.md §4](../operations/cache-and-cdn.md) |

La última es la más importante para el equipo editorial: una página nueva del CMS no aparece hasta el siguiente despliegue, porque `generateStaticParams()` se ejecuta en build.

## 6. Al cerrar sesión

`logout()` limpia `localStorage` y la cookie, pero **no vacía la caché de React Query**. En la práctica no importa: `logout()` provoca una redirección que desmonta el árbol, y la caché vive en memoria.

Aun así, `queryClient.clear()` en el cierre de sesión sería más explícito y defensivo. Registrado como observación menor.

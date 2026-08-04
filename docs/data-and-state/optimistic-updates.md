# Actualizaciones optimistas

- **Fecha de evidencia:** 2026-08-03

## 1. Estado: no se usan

**No se detectó ninguna actualización optimista** (`onMutate` + `setQueryData` + rollback en `onError`) en el proyecto.

Toda mutación sigue el patrón conservador:

```
acción → estado de carga → respuesta del servidor → invalidar o actualizar → interfaz nueva
```

## 2. Los dos casos que se le parecen, y por qué no lo son

### a) Contador de notificaciones ante un mensaje SSE

```ts
setUnreadCount((n) => n + 1);
setRecent((prev) => [event, ...prev].slice(0, 10));
```

**No es optimista**: el evento ya ocurrió en el servidor y llegó por el stream. Se está reflejando un hecho confirmado, no anticipando uno.

### b) Marcar como leída

```ts
const markRead = useCallback(async (id: string) => {
  await markNotificationRead(id);        // ← espera al servidor
  setRecent((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  setUnreadCount((c) => c - 1);
}, [setUnreadCount]);
```

**No es optimista**: el `await` precede a la actualización local. Si la petición falla, la interfaz no cambia — que es el comportamiento correcto, aunque menos ágil.

Una versión optimista actualizaría primero y revertiría en caso de error.

## 3. Valoración

Que no se usen actualizaciones optimistas es **una decisión defendible**, no una carencia:

| A favor de no usarlas | En contra |
|---|---|
| Menos código y menos rutas de fallo | Latencia percibida en cada acción |
| La interfaz nunca miente | — |
| Sin rollback que probar | — |
| **Crítico en datos clínicos**: mostrar una cita como confirmada antes de que lo esté es peor que esperar un segundo | — |

La última fila es el argumento decisivo. En `/admin/solicitudes`, confirmar o cancelar una cita afecta a la agenda de una persona real. Mostrar el resultado antes de que el servidor lo acepte podría llevar a alguien a comunicar una confirmación que luego falló.

## 4. Dónde sí tendrían sentido

Si alguna vez se adoptan, los candidatos con mejor relación beneficio/riesgo serían:

| Caso | Riesgo si falla |
|---|---|
| Marcar una notificación como leída | Bajo — se revierte el badge |
| Marcar todas como leídas | Bajo |
| Reordenar elementos en el CMS | Bajo |

Y los que **no** deberían serlo:

| Caso | Motivo |
|---|---|
| Confirmar o cancelar una cita | Afecta a la agenda de personas reales |
| Crear una transacción contable | Dato económico |
| Crear o modificar un usuario | Afecta a permisos |
| Reservar una cita | La franja puede estar ocupada |

El último es especialmente claro: una reserva optimista mostraría «cita reservada» y podría fallar por conflicto de franja. Mostrar el éxito antes de tenerlo sería directamente engañoso.

## 5. Requisito previo

Adoptar actualizaciones optimistas exigiría antes:

1. Una convención de claves de consulta que permita invalidar con precisión.
2. Pruebas del camino de rollback — hoy no hay ninguna prueba de mutación.

Sin lo segundo, una actualización optimista mal revertida deja la interfaz mostrando datos que no existen, y **nada lo detectaría**.

Registrado como observación. Adoptarlas sería `CAMBIO DE PRODUCTO`.

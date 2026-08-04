# Runbook — Backend no disponible

## Síntoma

Toda pantalla con datos muestra error. Mensaje típico: **«No se pudo conectar con el servidor (https://…). Detalle: …»**, que corresponde a `ApiError` con `status: 0`.

Las rutas sin datos (`/privacidad`, `/terminos`, `/403`) siguen funcionando: son HTML estático.

## Impacto

- Sitio público: parcialmente operativo (la landing y el CMS fallan; las páginas legales no).
- Portales privados: **inutilizables**. No se puede ni iniciar sesión.

## Diagnóstico seguro

```bash
# ¿Responde el backend?
curl -s -o /dev/null -w "%{http_code}\n" https://API/api/v1/health

# ¿Resuelve el DNS y hay TLS?
curl -sv https://API/api/v1/health 2>&1 | head -20
```

En el navegador → Network: peticiones fallidas sin código de estado (fallo de conexión) frente a peticiones con `5xx` (el backend responde pero falla).

**Distinción clave:**

| Observación | Significado |
|---|---|
| `ApiError` con `status: 0` | No hubo respuesta: red, DNS, TLS o backend caído |
| `status: 502` / `503` / `504` | Hay algo respondiendo: proxy o backend degradado |
| `status: 0` **solo en producción** | Sospechar de la CSP → [csp-bloquea-peticiones.md](csp-bloquea-peticiones.md) |
| CORS en consola | El backend responde pero no autoriza el origen |

## Evidencia a recoger

- Código de estado de `/api/v1/health`.
- Valor de `NEXT_PUBLIC_API_BASE_URL` (es público, puede compartirse).
- Mensajes de consola: ¿fallo de red o bloqueo de CSP?
- Trazas: tasa de spans `http.client` con estado de error.

## Mitigación

**No corresponde al frontend.** La aplicación ya se comporta correctamente ante esta situación:

- `retry: 1` en React Query evita amplificar la carga sobre un backend caído (el valor por defecto de la librería, `retry: 3`, la cuadruplicaría).
- `ApiError(status 0)` produce un mensaje claro en lugar de una pantalla rota.
- Las páginas estáticas siguen sirviéndose.

Acciones posibles: confirmar con el equipo de backend, y comunicar la incidencia a las personas usuarias por un canal externo.

## Rollback

Un rollback del frontend **no resuelve nada** si el backend está caído. Solo tiene sentido si el incidente coincidió con un despliegue del frontend que cambió `NEXT_PUBLIC_API_BASE_URL`.

## Prevención

1. Monitorizar `/api/v1/health` desde fuera.
2. Alertar sobre la tasa de error de los spans `http.client` (ver [../../performance/monitoring.md](../../performance/monitoring.md)).
3. Considerar un timeout explícito en `apiRequest()` (brecha `API-03`): hoy una petición a un backend que acepta la conexión pero no responde **queda colgada indefinidamente**, y la persona ve un estado de carga sin fin en lugar de un error.

La recomendación 3 es la única mejora real que el frontend puede aportar frente a este escenario.

## Escalado

Equipo de backend. Contacto sin definir en el repositorio (`OPS-05`).

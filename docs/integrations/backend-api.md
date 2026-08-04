# Integración con el backend

- **Fecha de evidencia:** 2026-08-03
- **Evidencia:** [endpoints.ts](../../src/shared/api/endpoints.ts), [client.ts](../../src/shared/api/client.ts)
- Complementa el documento preexistente [api/api-contracts.md](../api/api-contracts.md), que no se ha modificado.

---

## 1. Configuración

| Variable | Obligatoria | Efecto si falta |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | **Sí en la práctica** | `apiRequest()` lanza `ApiError(…, 500)` en la primera llamada |

En el esquema de zod es `optionalUrl` (opcional), pero sin ella **ninguna pantalla con datos funciona**. Es opcional para que el build no falle sin backend, no porque la aplicación pueda operar sin él.

Normalización aplicada por `apiBaseUrl()`: se recorta un sufijo `/api/v1` o `/api`, porque `ENDPOINTS` ya lo incluye. Y en desarrollo se rechaza que la variable apunte al propio frontend.

---

## 2. Anatomía de `apiRequest()`

```ts
apiRequest<T>(path: string, options?: {
  method?: string;
  body?: unknown;        // objeto → JSON saneado; FormData → intacto
  auth?: boolean;        // false = no adjunta Bearer ni expulsa ante 401
  headers?: HeadersInit;
  ...RequestInit
}): Promise<T>
```

| Comportamiento | Detalle |
|---|---|
| Autenticación | `Authorization: Bearer <jwt>` salvo `auth: false` |
| `Content-Type` | `application/json` salvo `FormData` (el navegador pone el `boundary`) |
| Saneado del cuerpo | `pruneOptionalEmptyValues()` elimina `null`, `undefined` y cadenas vacías en claves opcionales |
| Reintento | **Una vez** ante `400` con `property X should not exist` |
| `401` | Limpia sesión y redirige al login con `?next=` |
| Errores | `ApiError(mensaje, status, details)`; `status: 0` si no hubo respuesta |
| Trazas | Span `http.client` con método, plantilla de ruta y código de estado |
| **Timeout** | ✅ **30 s por defecto**, configurable con `timeoutMs`; `0` lo desactiva |
| **Cancelación** | ✅ Se acepta y propaga `options.signal` |

### Tiempo y cancelación

```ts
const DEFAULT_TIMEOUT_MS = 30_000;
```

Sin límite, un backend que acepta la conexión pero nunca responde deja la petición viva hasta que el navegador la corta por su cuenta. React Query no puede rescatar ese caso: seguiría mostrando carga indefinidamente.

La señal del consumidor y la del timeout se combinan (`AbortSignal.any` cuando existe, composición manual cuando no — jsdom y algunos entornos no lo traen). El temporizador se limpia siempre en `finally`.

Los tres finales con `status: 0` se distinguen por `details`:

| `details` | Cuándo | Mensaje |
|---|---|---|
| `{ cancelled: true }` | Lo canceló el consumidor | «La petición se canceló.» |
| `{ timeout: true }` | Se agotó el tiempo | «El servidor no respondió a tiempo (30 s)…» |
| `{ originalError }` | Fallo de red | «No se pudo conectar con el servidor…» |

Distinguir la cancelación es lo que evita presentar como error del servidor algo que React Query hace de forma rutinaria al descartar consultas obsoletas.

Cubierto por `tests/unit/api-client-timeout.test.ts`. Brechas `API-03` y `API-04`: **cerradas**.

---

## 3. Grupos de endpoints

`ENDPOINTS` declara ~110 claves en 13 grupos, todas con prefijo `/api/v1`.

| Grupo | Claves | Operaciones destacadas |
|---|---:|---|
| `auth` | 7 | `login`, `registerPatient`, `registerTherapist`, `refresh`*, `logout`*, restablecimiento de contraseña |
| `users` | 13 | `me`, `list`, perfiles de paciente y terapeuta, estado, avatar |
| `appointments` | 5 | `createMine`, `mine`, `adminList`, `updateStatus`, `createForPatient` |
| `booking` | 2 | `availability`, `therapists` |
| `therapy` | 11 | Agenda, horarios propios y de terapeuta, pagos |
| `products` | 13 | Enfoques y servicios (admin y público) |
| `cms` | 5 | Páginas públicas y elementos |
| `files` | 13 | Subida, firma Cloudinary, URL firmada, descarga, administración |
| `editorial` | 4 | Alias del CMS para la Biblioteca |
| `content` | 9 | Suscripción a noticias, premium, suscriptores |
| `publicUi` | 13 | Landing configurable |
| `accounting` | 16 | Cuentas, grupos, centros de costo, transacciones |
| `tutorials` | 2 | ⚠️ **El backend no los implementa aún** |
| `health` | 1 | `check` |

\* `refresh` y `logout` están declarados pero **nunca se invocan**.

**~110 claves ≈ 70 URLs únicas.** Varios grupos son alias de aplicación sobre las mismas URLs: los cinco de `publicUi` que apuntan a `/public/pages/:slug`, `editorial.publicPage` que duplica `cms.publicPage`, y `therapy.{appointmentRequests,patientAppointments,therapistAgenda}` sobre `appointments.*`. No es un error: dan nombre de dominio a la misma ruta.

---

## 4. Endpoints de notificaciones — ahora en el registro

Antes se construían a mano en `notifications.api.ts` y en `buildSseUrl()`, quedando fuera de cualquier revisión que se apoyara en `endpoints.ts`. Ya están registrados:

```ts
notifications: {
  list:        `${API_PREFIX}/admin/notifications`,
  unreadCount: `${API_PREFIX}/admin/notifications/unread-count`,
  markRead:    `${API_PREFIX}/admin/notifications/:notificationId/read`,
  markAllRead: `${API_PREFIX}/admin/notifications/read-all`,
  stream:      `${API_PREFIX}/admin/notifications/stream`
}
```

`stream` es un canal SSE, no una petición de `apiRequest`; se registra igualmente para que **exista un solo sitio donde consultar qué URLs del backend consume el frontend**.

Efecto secundario corregido: `listNotifications()` añadía `?` siempre, incluso sin parámetros, lo que podía activar la rama de reintento del cliente ante un `400`. Ahora solo lo añade si hay query.

Brecha `API-01`: **cerrada**.

---

## 5. Deriva contractual

| ID | Deriva | Severidad | Estado |
|---|---|---|---|
| `API-01` | Endpoints de notificaciones fuera de `ENDPOINTS` | MEDIUM | 🟢 **Cerrada** |
| `API-02` | **Sin OpenAPI ni tipos generados**; todos los tipos son manuales | **HIGH** | 🔴 Abierta — requiere backend |
| `API-03` | Sin timeout en las peticiones | MEDIUM | 🟢 **Cerrada** |
| `API-04` | Sin cancelación | LOW | 🟢 **Cerrada** |
| `API-05` | `tutorials.*` declarado, backend ausente | LOW | 🟢 Gestionada con bandera apagada |
| `API-06` | `auth.refresh` y `auth.logout` declarados y no usados | LOW | 🔴 Abierta — requiere backend |

**`API-02` es la más relevante.** Sin especificación compartida, un cambio en el backend solo se descubre cuando algo falla en producción. La única verificación real es `tests/integration/backend-contract.test.ts`, que exige un backend accesible y **no se ejecuta en CI**.

El proyecto lo compensa con defensas en el cliente —`normalizeSession()`, `normalizePaginatedResponse()`, `isRecord()`, el reintento por validación— que absorben mucha variabilidad. Es una mitigación eficaz, pero reactiva: convierte un fallo en un comportamiento degradado, no lo previene.

---

## 6. Convenciones para código nuevo

1. Toda URL nueva se declara en `ENDPOINTS`, nunca en línea.
2. Toda llamada pasa por `apiRequest()` (excepción documentada: el `EventSource` del SSE).
3. Los parámetros de ruta usan `:nombre` y se sustituyen con `replacePathParam()`.
4. Las respuestas se normalizan en el `*.api.ts` de la feature, no en el componente.
5. Una llamada deliberadamente pública usa `{ auth: false }`.
6. Ningún dato personal en la query string, y **nunca** un token.

La regla 6 tiene ya una excepción documentada (`SEC-01`) que existe por una limitación de `EventSource`, no por elección.

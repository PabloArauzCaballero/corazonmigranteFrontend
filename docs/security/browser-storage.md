# Almacenamiento en el navegador

- **Fecha de evidencia:** 2026-08-03

## 1. Inventario completo

| Clave | Almacén | Contenido | Sensibilidad | Escritor | Limpieza |
|---|---|---|---|---|---|
| `cm_session` | `localStorage` | `{userId, fullName, email, role, permissions, token}` | **Crítica** — contiene el JWT y el correo | `persistClientSession()` | `clearClientSession()`, expiración, `logout()` |
| `cm_session_role` | Cookie | Solo el rol | Baja | `persistClientSession()` | `max-age=0` al limpiar |
| Progreso de tutoriales | `localStorage` | Identificadores de tutorial y paso | Baja | [tutorial/storage/](../../src/features/tutorial/storage/) | Manual |
| Id de sesión de telemetría | Ver [session-id.ts](../../src/observability/core/session-id.ts) | Identificador aleatorio | Baja | `telemetrySessionId()` | Rotado en `logout()` |

**No se usan** `sessionStorage`, IndexedDB, Cache API ni Service Workers.

## 2. Atributos de la cookie de rol

```ts
function roleCookieAttributes() {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";
  return `path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
}
```

| Atributo | Valor | Motivo |
|---|---|---|
| `path=/` | Toda la aplicación | El middleware la leería en cualquier ruta |
| `SameSite=Lax` | Sí | Impide envío en peticiones entre sitios de tipo POST |
| `Secure` | **Solo en HTTPS** | En `http://localhost` el navegador la descartaría y el desarrollo quedaría sin sesión |
| `HttpOnly` | **No** | Deliberado: la escribe JavaScript. No contiene el token |
| `Expires`/`Max-Age` | No se fija | Cookie de sesión: desaparece al cerrar el navegador |

## 3. Por qué el JWT está en `localStorage`

No es una preferencia: es una consecuencia de [ADR-0002](../adr/ADR-0002-exportacion-estatica.md). Una cookie `HttpOnly` debe emitirla un servidor, y aquí **no hay servidor de aplicación**. Las opciones reales eran `localStorage`, `sessionStorage` o memoria:

| Opción | Ventaja | Coste | Elegida |
|---|---|---|---|
| `localStorage` | Sobrevive a recargas y pestañas | Accesible a todo script del origen | ✅ |
| `sessionStorage` | Aislado por pestaña | Se pierde al abrir una pestaña nueva | ❌ |
| Solo en memoria | Sin persistencia | Cada recarga exigiría reautenticarse | ❌ |

Riesgo residual **aceptado**, condicionado a: no introducir scripts de terceros, no usar `dangerouslySetInnerHTML` sin sanear, mantener `script-src 'self'`.

## 4. Datos personales almacenados

`cm_session` guarda `fullName` y `email` de la persona usuaria. **No** guarda datos clínicos, de pacientes ajenos ni contables: esos viven solo en memoria mientras dura la pantalla y desaparecen al recargar (React Query no persiste su caché).

Es una propiedad de privacidad relevante: un equipo compartido no conserva historiales de pacientes en disco. Ver [privacy.md](privacy.md).

## 5. Reglas para código nuevo

1. Leer la sesión **solo** con `readClientSession()` — aplica la comprobación de expiración.
2. No guardar datos de pacientes en `localStorage` bajo ninguna circunstancia.
3. No persistir la caché de React Query (`persistQueryClient`) sin revisar qué datos acabarían en disco.
4. Toda clave nueva debe registrarse en la tabla del §1 y en [privacy.md](privacy.md).
5. Toda clave nueva debe limpiarse en `logout()`.

# Seguridad del frontend

- **Fecha de evidencia:** 2026-08-03
- **Naturaleza:** `DOCUMENTAL`. Ninguna de las brechas de este documento se corrige aquí.

Documento complementario del preexistente [security/auth-rbac.md](auth-rbac.md), que no se ha modificado.

---

## 1. El principio que gobierna todo

> **El frontend no puede proteger datos. Solo puede proteger la experiencia.**

`output: "export"` produce HTML estático. El HTML de `/admin`, `/paciente` y `/terapeuta` es **descargable por cualquiera sin sesión**. El bundle JavaScript es público e inspeccionable.

Lo que sí protege los datos es el backend NestJS validando el JWT en **cada** endpoint. El propio código lo declara en [guard.tsx](../../src/shared/auth/guard.tsx):

> *«Esto protege la interfaz, no los datos: el HTML estático es público por definición. Quien decide qué información se entrega es el backend, validando el JWT en cada endpoint.»*

**Corolario operativo:** ocultar un botón, filtrar un menú por permisos o bloquear una ruta con `ClientRoleGuard` son decisiones de **usabilidad**. Ninguna es un control de seguridad. Si un endpoint del backend no comprueba el rol, la restricción de la interfaz no lo salva.

---

## 2. Autenticación

| Aspecto | Implementación | Archivo |
|---|---|---|
| Login | `POST /api/v1/auth/login` | `features/auth/auth.api.ts` |
| Normalización | `normalizeSession()` absorbe envoltorios y variantes de rol | `shared/auth/session.ts` |
| Persistencia del token | `localStorage["cm_session"]` | `shared/auth/cookies.ts` |
| Persistencia del rol | Cookie `cm_session_role` | `shared/auth/cookies.ts` |
| Envío | Cabecera `Authorization: Bearer <jwt>` | `shared/api/client.ts` |
| Expiración | Lectura del claim `exp` con margen de 15 s | `shared/auth/cookies.ts` |
| Expulsión ante `401` | `handleUnauthorizedSession()` | `shared/api/client.ts` |
| Cierre de sesión | `logout()` limpia sesión y rota el id de telemetría | `shared/auth/use-session.tsx` |
| **Renovación de token** | ❌ **No implementada** | `ENDPOINTS.auth.refresh` existe pero **nunca se invoca** |

### Lectura del `exp` sin validar firma

```ts
function readTokenExpiry(token: string): number | null { … atob(payload) … }
```

El comentario del código es exacto y correcto:

> *«No es una comprobación de seguridad — quien valida el token es el backend. Sirve solo para que el frontend deje de considerar válida una sesión ya expirada y mande a la persona al login, en vez de dejarla en una pantalla que dispara 401 en bucle.»*

Decodificar un JWT en el cliente sin verificar la firma **no otorga confianza**. Aquí se usa exclusivamente como optimización de experiencia. Está bien planteado.

---

## 3. Autorización

Cinco roles y doce permisos en [shared/auth/roles.ts](../../src/shared/auth/roles.ts).

| Rol | Permisos |
|---|---|
| `PACIENTE` | `profile:read`, `profile:update`, `booking:create` |
| `TERAPEUTA` | `profile:read`, `profile:update`, `therapy:read_assigned`, `booking:create_for_patient` |
| `ADMIN` | `admin:read`, `users:manage`, `therapy:manage`, `products:manage`, `public_content:manage`, `booking:create_for_patient` |
| `SUPER_ADMIN` | Los de `ADMIN` + `accounting:read`, `accounting:manage`, `profile:read`, `profile:update` |
| `CONTADOR` | `admin:read`, `accounting:read`, `accounting:manage`, `profile:read`, `profile:update` |

**Observación:** `ADMIN` **no** tiene `profile:read` ni `profile:update`, mientras que `SUPER_ADMIN` y `CONTADOR` sí. Puede ser deliberado o una omisión. Se documenta como estado real; corregirlo sería `CAMBIO DE PRODUCTO`.

**Los permisos se derivan localmente.** `normalizeSession()` hace `permissions = ROLE_PERMISSIONS[role]` y **descarta** los que envíe el backend. Consecuencia: si el backend concede un permiso extra a un usuario concreto, el frontend no lo verá. Es coherente con el principio del §1 — la matriz del cliente es solo para pintar la interfaz.

---

## 4. Riesgos identificados

### 🔴 SEC-01 — JWT en la query string del stream SSE · CRITICAL

```ts
const url = `${sseUrl}?token=${encodeURIComponent(token)}`;
const es = new EventSource(url);
```

**Causa técnica:** `EventSource` es la única API del navegador que no admite cabeceras personalizadas. No se puede enviar `Authorization`.

**Exposición:** las URLs con query string quedan registradas en logs de servidores y proxies, en el historial del navegador y en cabeceras `Referer` hacia terceros. Un JWT ahí es un secreto en un lugar diseñado para ser registrado.

**Lo que el equipo ya hizo bien:** el span de conexión **no registra ninguna URL**, con un comentario explícito. La telemetría no filtra el token.

**Lo que sigue expuesto:** el propio canal HTTP y todo lo que registre esa URL en el camino.

**Mitigaciones posibles** (todas `CAMBIO DE PRODUCTO`, requieren backend):
1. Token de un solo uso y vida corta emitido para el stream.
2. Cookie de sesión en lugar de query string.
3. Sustituir SSE por WebSocket autenticando en el primer mensaje.

### 🟠 SEC-03 — JWT en `localStorage` · HIGH

Accesible a cualquier script del origen. Un XSS conseguiría exfiltrarlo.

**Por qué no se usa una cookie `HttpOnly`:** no hay servidor de aplicación que pueda emitirla. Es una consecuencia estructural de [ADR-0002](../adr/ADR-0002-exportacion-estatica.md), no un descuido.

**Mitigaciones existentes:** CSP con `script-src 'self'`, ausencia total de scripts de terceros, expiración proactiva del token.

**Riesgo residual: aceptado**, condicionado a que no se introduzcan scripts de terceros ni HTML sin sanear.

### 🟢 SEC-02 — Divergencia de roles entre las dos capas · CERRADA

`middleware.ts` admitía `TERAPEUTA` en `/admin`; `ClientRoleGuard` no. Ya están alineados, con un comentario que fija la fuente de verdad de cada prefijo. Detalle en [routes/route-catalog.md §8](../routes/route-catalog.md).

### 🟡 SEC-04 — CSP permisiva · MEDIUM

`script-src` incluye `'unsafe-inline'` y `'unsafe-eval'`; `connect-src` es `'self' https:`. Análisis completo en [content-security-policy.md](content-security-policy.md).

---

## 5. Superficies de ataque evaluadas

| Vector | Estado | Evidencia |
|---|---|---|
| **XSS** | 🟢 Bajo | No se detectó ningún `dangerouslySetInnerHTML`. React escapa por defecto |
| **CSRF** | 🟢 No aplica | La autenticación es por cabecera `Bearer`, no por cookie de sesión. Una petición entre orígenes no puede añadir esa cabecera |
| **Clickjacking** | 🟢 Mitigado | `X-Frame-Options: DENY` + `frame-ancestors 'none'` |
| **Open redirect** | 🟢 Mitigado | `safeInternalPath()` en [login-form.tsx](../../src/features/auth/login-form.tsx) exige que `?next=` empiece por una única barra: descarta `//evil.com` y `https://evil.com`. Es el **único** punto donde el parámetro se consume; `guard.tsx` y `client.ts` solo lo escriben, a partir de `usePathname()`. Cubierto por `tests/unit/login-flow.test.tsx`. `SEC-05` estaba ya cerrada y se registró por error en la primera auditoría |
| **MIME sniffing** | 🟢 Mitigado | `X-Content-Type-Options: nosniff` |
| **Degradación a HTTP** | 🟢 Mitigado | HSTS un año con `includeSubDomains` |
| **Fuga por `Referer`** | 🟢 Mitigado | `Referrer-Policy: strict-origin-when-cross-origin` |
| **Indexación de portales privados** | 🟢 Mitigado | `noindex` en metadatos + `X-Robots-Tag` + `Cache-Control: no-store` |
| **Cadena de suministro** | 🟡 Ver [dependencies.md](dependencies.md) | Sin auditoría automatizada en CI |
| **Source maps en producción** | 🟡 No verificado | `productionBrowserSourceMaps` no está declarado; Next.js **no** los emite por defecto |
| **Secretos en el bundle** | 🟢 Correcto | Todas las variables llevan prefijo `NEXT_PUBLIC_` y ninguna es un secreto: URLs de API, URLs de Cloudinary, slugs, un teléfono de contacto y una bandera |

---

## 6. Enlaces externos

No se detectó apertura de ventanas hacia dominios externos con `target="_blank"` sin `rel`. Regla para código nuevo: todo `target="_blank"` debe llevar `rel="noopener noreferrer"`.

## 7. Cabeceras de seguridad activas

Definidas en [public/_headers](../../public/_headers) y aplicadas por Cloudflare Pages. Tabla completa en [architecture/containers.md §2.3](../architecture/containers.md).

**Limitación operativa:** estas cabeceras **solo existen en el despliegue de Cloudflare Pages**. `next dev` no las aplica. Cualquier prueba de seguridad en local **no** refleja la configuración real.

---

Ver también: [threat-model.md](threat-model.md) · [session-and-tokens.md](session-and-tokens.md) · [browser-storage.md](browser-storage.md) · [privacy.md](privacy.md) · [incident-response.md](incident-response.md)

# Modelo de amenazas (STRIDE)

- **Fecha de evidencia:** 2026-08-03
- **Alcance:** el frontend y sus canales. El backend queda fuera salvo donde el frontend depende de él.
- **Metodología:** STRIDE por canal y activo.

---

## 1. Activos

| # | Activo | Sensibilidad | Dónde vive |
|---|---|---|---|
| A1 | JWT de sesión | **Crítica** | `localStorage["cm_session"]` |
| A2 | Datos personales de pacientes | **Crítica** | En memoria durante la sesión; en respuestas de la API |
| A3 | Datos clínicos (citas, enfoques, objetivos terapéuticos) | **Crítica** | Igual que A2 |
| A4 | Datos contables | Alta | Pantallas de `/admin/contabilidad` |
| A5 | Rol de la persona usuaria | Media | Cookie `cm_session_role` + `localStorage` |
| A6 | Contenido CMS y publicaciones | Media | Backend; público en su mayoría |
| A7 | Trazas de telemetría | Media | Colector OTel |
| A8 | Progreso de tutoriales | Baja | `localStorage` |

**A2 y A3 son datos de salud de personas migrantes.** Es la razón de que la redacción en telemetría y logs esté tratada con el rigor que se documenta en [privacy.md](privacy.md).

---

## 2. Fronteras de confianza

| Frontera | De → A | Control |
|---|---|---|
| F1 | Persona ↔ Navegador | Ninguno bajo control del frontend |
| F2 | Navegador ↔ Cloudflare Pages | TLS + HSTS + cabeceras de `_headers` |
| F3 | Navegador ↔ Backend | TLS + JWT `Bearer` |
| F4 | Navegador ↔ Backend (SSE) | TLS + **JWT en query string** ⚠️ |
| F5 | Navegador ↔ Cloudinary | TLS; lectura sin autenticación |
| F6 | Navegador ↔ Pages Function (telemetría) | TLS, mismo origen, **sin autenticación** |

---

## 3. Análisis STRIDE

### S — Suplantación (Spoofing)

| # | Amenaza | Activo | Prob. | Impacto | Mitigación | Riesgo residual |
|---|---|---|---|---|---|---|
| S1 | Robo del JWT desde la query string del SSE (logs de proxy, historial, `Referer`) | A1 | **Media** | **Alto** | Ninguna en el canal. La telemetría no lo registra | 🔴 **Alto — SEC-01** |
| S2 | Robo del JWT desde `localStorage` vía XSS | A1 | Baja | **Alto** | CSP `script-src 'self'`; sin scripts de terceros; sin `dangerouslySetInnerHTML` | 🟠 Medio — SEC-03 |
| S3 | Manipulación de la cookie `cm_session_role` para simular otro rol | A5 | **Alta** (trivial) | **Nulo** | El rol efectivo sale de `localStorage`; la API exige un JWT válido | 🟢 Bajo |
| S4 | Reutilización de un JWT caducado | A1 | Baja | Bajo | El backend valida `exp`; el frontend además lo descarta con 15 s de margen | 🟢 Bajo |

**Sobre S3:** cualquiera puede editar `cm_session_role` desde la consola del navegador y ver la interfaz de otro rol. **No obtiene ningún dato**: el backend rechaza el JWT que no corresponda. Es la demostración práctica del principio del §1 de [frontend-security.md](frontend-security.md).

### T — Manipulación (Tampering)

| # | Amenaza | Activo | Prob. | Impacto | Mitigación | Riesgo residual |
|---|---|---|---|---|---|---|
| T1 | Modificar el bundle en tránsito | Todos | Muy baja | Alto | TLS + HSTS | 🟢 Bajo |
| T2 | Inyectar script vía CSP permisiva (`unsafe-inline`/`unsafe-eval`) | A1, A2 | Baja | **Alto** | `script-src 'self'` limita el origen; no hay entrada de HTML sin sanear | 🟡 Medio — SEC-04 |
| T3 | Envenenar trazas contra la Pages Function sin autenticar | A7 | Media | Bajo | Ninguna. El endpoint acepta cualquier lote OTLP del origen | 🟡 Medio |
| T4 | Alterar el progreso de tutoriales en `localStorage` | A8 | Alta | Nulo | Ninguna necesaria | 🟢 Bajo |
| T5 | Open redirect vía `?next=` | — | Baja | Medio | **Sin validación explícita** de que sea ruta relativa | 🟡 Medio — SEC-05 |

### R — Repudio (Repudiation)

| # | Amenaza | Prob. | Impacto | Mitigación | Riesgo residual |
|---|---|---|---|---|---|
| R1 | Negar haber realizado una acción administrativa | Media | Medio | La auditoría corresponde al backend. El frontend emite spans de negocio (`auth.logout`, `auth.session_expired`) sin identidad de usuario | 🟡 Medio — el frontend no es fuente de auditoría, y no debe serlo |

### I — Divulgación de información (Information disclosure)

| # | Amenaza | Activo | Prob. | Impacto | Mitigación | Riesgo residual |
|---|---|---|---|---|---|---|
| I1 | JWT en logs de proxy por el SSE | A1 | **Media** | **Alto** | Ninguna | 🔴 **Alto — SEC-01** |
| I2 | Datos personales en atributos de span | A2, A3 | Baja | Alto | **Doble capa**: `sanitize.ts` en construcción + `SanitizingSpanProcessor` antes de exportar. `route-template.ts` sustituye identificadores por `:id`. Ambos con prueba unitaria | 🟢 Bajo |
| I3 | Datos personales en `logs/api-requests.log` | A2, A3 | Alta **en local** | Medio | Solo en desarrollo; redacción de `password\|token\|secret\|authorization`; truncado a 4 000 caracteres. **Los datos de paciente NO se redactan** | 🟡 Medio — el archivo local puede contener datos reales si se apunta a un backend real |
| I4 | Indexación de portales privados | A2 | Baja | Medio | `noindex` + `X-Robots-Tag` + `no-store` | 🟢 Bajo |
| I5 | Fuga por `Referer` hacia terceros | A5 | Baja | Bajo | `Referrer-Policy: strict-origin-when-cross-origin` | 🟢 Bajo |
| I6 | Datos personales en caché compartida | A2 | Baja | Medio | `Cache-Control: no-store` en los tres portales privados | 🟢 Bajo |
| I7 | Estructura interna deducible del bundle | A6 | Alta | **Nulo** | Ninguna necesaria: es una SPA, el código es público por diseño | 🟢 Bajo |

**Sobre I3 — riesgo práctico y poco evidente.** `logs/api-requests.log` redacta contraseñas y tokens, pero **no** nombres, correos ni detalles clínicos. Quien desarrolle contra un backend con datos reales acumulará datos personales en un archivo local sin cifrar. `.gitignore` cubre `*.log`, así que no llega al repositorio. Recomendación operativa: desarrollar contra datos sintéticos. Ver [privacy.md](privacy.md).

### D — Denegación de servicio

| # | Amenaza | Prob. | Impacto | Mitigación | Riesgo residual |
|---|---|---|---|---|---|
| D1 | Caída del backend | Media | **Alto** | `retry: 1` evita amplificar la carga; `ApiError(status 0)` da mensaje claro | 🟡 Medio — sin backend no hay aplicación |
| D2 | Bucle de reconexión del SSE | Baja | Bajo | `es.onerror` cierra el stream y **no reintenta** | 🟢 Bajo |
| D3 | Saturación de la Pages Function | Baja | Bajo | Muestreo configurable en `browser-sampling.ts` | 🟢 Bajo |
| D4 | Caída del CDN de Cloudinary | Baja | Bajo | `SmartImage` degrada a la imagen de respaldo | 🟢 Bajo |

### E — Elevación de privilegios

| # | Amenaza | Prob. | Impacto | Mitigación | Riesgo residual |
|---|---|---|---|---|---|
| E1 | Acceder a la interfaz de `/admin` sin ser administrador | **Alta** (trivial) | **Nulo** | Ninguna necesaria — el HTML es público. Los datos los niega el backend | 🟢 Bajo |
| E2 | Ejecutar una acción privilegiada mostrada por manipulación del cliente | Alta | **Depende del backend** | El frontend no puede impedirlo | 🔴 **Depende íntegramente del backend** |
| E3 | `TERAPEUTA` accediendo a `/admin` si se migra a despliegue con servidor | Baja | Bajo | El guard lo detiene con `ForbiddenState` | 🟡 Medio — SEC-02 |

**E2 es el riesgo más importante de todo este modelo y no es del frontend.** Si un endpoint de `/admin/*` no comprueba el rol, cualquiera con una sesión válida de paciente puede invocarlo — basta con abrir la consola. Ninguna medida del frontend cambia eso.

**Verificación recomendada al equipo de backend:** que cada endpoint bajo `/admin`, `/premium` y `/me` aplique guardas de rol propias, sin asumir que la interfaz filtra.

---

## 4. Resumen de riesgo residual

| Nivel | Cantidad | Identificadores |
|---|---:|---|
| 🔴 Alto | 2 | S1/I1 (SEC-01, mismo canal), E2 (responsabilidad del backend) |
| 🟠 Medio-alto | 1 | S2 (SEC-03) |
| 🟡 Medio | 6 | T2, T3, T5, I3, D1, E3 |
| 🟢 Bajo | 12 | El resto |

---

## 5. Recomendaciones priorizadas

Todas son `CAMBIO DE PRODUCTO`. **Ninguna se implementa en este plan.**

| # | Recomendación | Riesgo que cierra | Esfuerzo | Requiere backend |
|---:|---|---|---|---|
| 1 | Sustituir el token de la query string del SSE por un ticket de un solo uso y vida corta | SEC-01 | Medio | ✅ |
| 2 | Confirmar con el equipo de backend que **todo** endpoint privilegiado valida el rol | E2 | Bajo | ✅ |
| 3 | Validar que `?next=` sea una ruta relativa antes de redirigir | SEC-05 | Muy bajo | ❌ |
| 4 | Alinear los roles de `/admin` entre `middleware.ts` y `ClientRoleGuard` | SEC-02 | Muy bajo | ❌ |
| 5 | Sustituir `connect-src https:` por la lista explícita de orígenes | SEC-04 | Bajo | ❌ (requiere el dominio real) |
| 6 | Añadir auditoría de dependencias al pipeline | Cadena de suministro | Bajo | ❌ |
| 7 | Extender la redacción de `logs/api-requests.log` a datos personales | I3 | Bajo | ❌ |

La recomendación 3 es la de mejor relación impacto/esfuerzo: una comprobación de una línea sobre el parámetro `next`.

---

## 6. Revisión

Este modelo debe revisarse cuando: se retire `output: "export"`, se introduzca un script de terceros, se añada un canal de tiempo real, se incorpore pasarela de pago en el frontend, o cambie el mecanismo de autenticación.

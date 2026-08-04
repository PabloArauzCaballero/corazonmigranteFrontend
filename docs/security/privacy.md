# Privacidad y datos personales

- **Fecha de evidencia:** 2026-08-03

Corazón Migrante trata **datos de salud de personas migrantes**. Es la categoría más sensible que puede manejar una aplicación, y condiciona cómo se instrumenta, registra y depura.

---

## 1. Categorías de datos tratados

| Categoría | Ejemplos | Dónde aparece en el frontend |
|---|---|---|
| Identificativos | Nombre, correo, teléfono | Sesión, perfiles, tablas de usuarios |
| De salud | Citas, enfoques terapéuticos, objetivos, síntomas | Reserva, agenda, solicitudes, perfiles |
| De contacto y ubicación | País, ciudad, ocupación, profesión | Registro y perfil de paciente |
| Económicos | Transacciones, ventas de citas | `/admin/contabilidad/*` |
| De uso | Rutas visitadas, Web Vitals, resultados de acción | Telemetría |

---

## 2. Qué se persiste en el dispositivo

| Dato | Almacén | Justificación |
|---|---|---|
| Nombre y correo de la persona usuaria | `localStorage["cm_session"]` | Necesarios para la interfaz sin una petición extra |
| Rol | Cookie `cm_session_role` | Enrutado |
| Progreso de tutoriales | `localStorage` | Experiencia |

**No se persiste ningún dato de terceras personas.** Los datos de pacientes que ve un administrador o terapeuta viven solo en la caché en memoria de React Query y desaparecen al recargar. En un equipo compartido —escenario real en una consulta— no queda historial clínico en disco.

---

## 3. Redacción en telemetría

> **Referencia normativa:** [observability/frontend/05-data-privacy-policy.md](../observability/frontend/05-data-privacy-policy.md) del equipo define qué no puede salir del navegador, nunca. Esta sección describe los mecanismos técnicos que lo implementan; **ante discrepancia, prevalece el documento 05**.

> La telemetría está **apagada por defecto**, también en producción. Encenderla exige la revisión descrita en ese documento.

Arquitectura de **doble capa**, verificable y probada:

| Capa | Componente | Función |
|---|---|---|
| 1 — construcción | [`sanitize.ts`](../../src/observability/core/sanitize.ts) | `sanitizeErrorMessage()`, `containsSensitiveData()`, `FORBIDDEN_VALUE_PATTERNS`, `IDENTIFIER_SEGMENT_PATTERNS` |
| 1 — construcción | [`route-template.ts`](../../src/observability/core/route-template.ts) | `/admin/users/8f2a…` → `/admin/users/:id` |
| 1 — construcción | [`tracing.attributes.ts`](../../src/observability/core/tracing.attributes.ts) | `safeAttributes()` con `ALLOWED_ATTRIBUTE_KEYS`: **lista blanca**, no negra |
| 2 — exportación | [`sanitizing-span-processor.ts`](../../src/observability/browser/sanitizing-span-processor.ts) | Reexamina cada span antes de salir |

Ambos módulos de la capa 1 tienen prueba unitaria propia: `tests/unit/observability/sanitize.test.ts` y `route-template.test.ts`.

**Una lista blanca de atributos es la decisión correcta.** Con lista negra, cada atributo nuevo es sensible por defecto hasta que alguien se acuerda de prohibirlo; con lista blanca, es inerte hasta que alguien lo autoriza explícitamente.

### Casos concretos verificados en el código

| Situación | Qué se registra | Qué **no** se registra |
|---|---|---|
| Petición HTTP | Método, plantilla de ruta, código de estado | URL completa, query string, cuerpo, cabeceras |
| Sesión caducada | El hecho | Identidad, correo, token |
| Conexión SSE | Que se abrió el stream | **La URL — porque contiene el JWT** |
| Mensaje SSE | Que llegó un mensaje | El `payload` — puede contener el nombre de un paciente |
| Reintento por validación | El número de reintentos | Los nombres de las propiedades rechazadas (son campos de formulario) |
| Error de aplicación | Mensaje saneado | Datos que coincidan con los patrones prohibidos |

El caso del SSE es el más ilustrativo. El comentario del código:

> *«⚠️ `url` lleva el JWT en la query string. NUNCA puede entrar en un atributo de span. Por eso el span de conexión no registra ninguna URL: solo el hecho de que se abrió el stream.»*

---

## 4. Identificador de sesión de telemetría

`telemetrySessionId()` genera un identificador aleatorio **sin relación con `userId`**. Permite agrupar la actividad de una sesión sin identificar a la persona.

`logout()` lo **rota**. En un equipo compartido, la actividad de quien entra después no se mezcla con la de quien acaba de salir. Es un detalle pequeño con efecto real sobre la privacidad.

`userSegmentFromRole()` reduce el rol a un segmento (`USER_SEGMENT`), evitando registrar el rol exacto cuando basta con la categoría.

---

## 5. `logs/api-requests.log` — redacción en dos categorías

En **desarrollo**, `logApiCall()` escribe cada petición y respuesta en `logs/api-requests.log`.

La redacción cubría solo credenciales. Ahora distingue dos categorías, ambas por patrón sobre el **nombre de la clave**:

| Categoría | Patrón (extracto) | Sustitución |
|---|---|---|
| Credenciales | `password`, `contraseña`, `token`, `secret`, `authorization`, `signature`, `apikey` | `[redacted]` |
| **Datos personales y clínicos** | `email`, `correo`, `phone`, `telefono`, `dni`, `pasaporte`, `nombre`, `apellido`, `direccion`, `nacimiento`, `sintoma`, `diagnos`, `tratamiento`, `objetivo`, `motivo`, `nota`, `observacion`, `mensaje`… | `[dato personal omitido]` |

**El log conserva su utilidad**: estructura de la petición, claves presentes, códigos de estado y tiempos siguen visibles. Lo único que se sustituye es el **valor**.

**Limitación honesta:** redactar por nombre de clave no es infalible. Si el backend llamara `campo7` a un diagnóstico, no se detectaría. Cubre la forma en que el contrato real nombra estos campos, no toda forma concebible.

**Mitigaciones adicionales:** solo se activa con `NODE_ENV === "development"`; `.gitignore` cubre `*.log`; el contenido se trunca a 4 000 caracteres.

**Sigue siendo recomendable desarrollar contra datos sintéticos.** Brecha `PRIV-01`: **cerrada** en cuanto al riesgo principal.

---

## 6. Consentimiento

**No existe banner de cookies ni gestión de consentimiento.** Análisis de si hace falta:

| Elemento | ¿Requiere consentimiento? | Razonamiento |
|---|---|---|
| `cm_session` en `localStorage` | ❌ No | Estrictamente necesario para el servicio solicitado |
| `cm_session_role` | ❌ No | Igual |
| Progreso de tutoriales | ⚠️ Discutible | Preferencia de experiencia, no estrictamente necesaria |
| Telemetría OTLP | ⚠️ **Depende** | Es medición de rendimiento propia con datos saneados y sin identificar. Muchas jurisdicciones la eximen; otras no |
| Cookies de terceros | ❌ No aplica | **No hay ninguna** |

La ausencia total de analítica de terceros (Google Analytics, Segment, píxeles) simplifica enormemente la posición: no hay tratamiento con fines publicitarios ni transferencia a terceros con ese fin.

**Este documento no emite un dictamen jurídico.** La necesidad de consentimiento debe confirmarla el responsable legal del proyecto. Lo que sí aporta es el inventario exacto de lo que se trata, que es el insumo de esa decisión. Registrado como `PRIV-02`.

Existen páginas de [/privacidad](../../src/app/\(public\)/privacidad/page.tsx) y [/terminos](../../src/app/\(public\)/terminos/page.tsx). `pending-items.md` incluye `PENDIENTE_CM: Texto legal`, lo que indica que su contenido no está validado jurídicamente.

---

## 7. Retención

| Dato | Retención en el frontend |
|---|---|
| Sesión | Hasta el `exp` del JWT, el cierre de sesión o el borrado del almacenamiento |
| Caché de React Query | En memoria; se pierde al recargar |
| Progreso de tutoriales | Indefinida hasta limpieza manual |
| Trazas | Fuera del frontend: la decide el colector. Ver [infra/otel-collector/](../../infra/otel-collector/) |
| `logs/api-requests.log` | Indefinida en el disco de quien desarrolla |

---

## 8. Derechos de las personas interesadas

El frontend **no implementa** flujos de acceso, rectificación, supresión ni portabilidad. Son responsabilidad del backend y de los procesos de la organización. La rectificación parcial existe de hecho a través de los formularios de perfil (`/paciente/perfil`, `/terapeuta/perfil`).

---

## 9. Reglas para código nuevo

1. Ningún dato personal en atributos de span. Si hace falta un dato nuevo, añadirlo a `ALLOWED_ATTRIBUTE_KEYS` **y** justificarlo.
2. Ningún identificador en una plantilla de ruta: usar `route-template.ts`.
3. Ningún dato de terceras personas en `localStorage`.
4. Ninguna captura de pantalla con datos reales en la documentación.
5. Toda integración externa nueva exige revisar esta página y [threat-model.md](threat-model.md).

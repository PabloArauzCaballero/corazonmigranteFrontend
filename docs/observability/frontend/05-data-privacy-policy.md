# 05 — Política de datos y privacidad de la telemetría (Fase 34)

> **Contexto que condiciona todo lo demás.** Corazón Migrante es un producto de
> acompañamiento psicológico para personas migrantes. Los datos que circulan por el
> frontend son, en su mayoría, **datos de salud** y, en muchos casos, de personas en
> situación administrativa vulnerable. Una fuga en un sistema de trazas no es un
> incidente técnico: es un daño directo a personas concretas.
>
> El criterio, en consecuencia, es **restrictivo por defecto**: se registra lo mínimo
> que permite diagnosticar, y ante la duda no se registra.

---

## 1. Datos PERMITIDOS

Solo estos. La lista es cerrada y está impuesta por código en
`ALLOWED_ATTRIBUTE_KEYS` (`src/observability/core/tracing.constants.ts`): cualquier
clave fuera de ella se descarta antes de llegar a un span.

| Categoría | Atributos | Cardinalidad |
| --- | --- | --- |
| Despliegue | `app.release`, `app.build.id`, `app.environment`, `service.*` | 1 por despliegue |
| Navegación | `app.route.template`, `app.route.from`, `app.route.to`, `ui.navigation.type` | ≤ 58 |
| Negocio | `app.feature`, `app.operation`, `ui.component`, `ui.action`, `ui.result`, `ui.form.name` | decenas |
| Red | `http.request.method`, `http.response.status_code`, `server.address`, `url.path`, `network.request.type` | acotada |
| Validación | `validation.success`, `validation.error.count` (0–99) | acotada |
| Autenticación | `auth.method`, `auth.result`, `auth.failure.category` | ≤ 7 |
| Archivos | `file.type`, `file.extension`, `file.size.bucket`, `upload.strategy` | ≤ 12 |
| Errores | `error.type`, `error.source`, `error.handled` | ≤ 20 |
| Sesión | `app.session.id`, `app.authenticated`, `app.user.segment` | ver §4 |
| Rendimiento | `web_vital.name`, `web_vital.value`, `web_vital.rating` | ≤ 15 |
| Soporte | `app.support.trace_ref` (eco de `x-trace-id` del backend) | alta |

---

## 2. Datos PROHIBIDOS

Esta lista es normativa. **Nada de esto puede aparecer en una traza, en ningún caso.**

### Credenciales y sesión
Contraseñas · PIN · códigos 2FA · códigos de recuperación · access token · refresh
token · cookies · cabecera `Authorization` · claims del JWT · URL con `?token=`.

### Identidad
Correo · teléfono · nombre y apellidos · dirección · documento de identidad ·
identificador de usuario · país o ciudad de residencia · geolocalización ·
huella del navegador (*fingerprinting*).

### Datos clínicos
Síntomas · objetivos terapéuticos · diagnósticos · notas de cita (`notesForTherapist`,
`adminNotes`) · historial · contenido de sesiones · cualquier texto libre escrito por
la persona usuaria o por quien la atiende.

### Datos financieros
Importes · cuentas · tarjetas · asientos contables · datos de facturación.

### Contenido
Cuerpos de petición y de respuesta · valores de formulario · nombres de archivo ·
contenido de archivos · base64 · EXIF · URL firmadas (Cloudinary) · HTML · `outerHTML`
· `textContent` · selectores CSS largos · texto copiado o pegado · pulsaciones de
teclado.

### Estado de la aplicación
Props de React · estado de componentes · árbol de componentes (`componentStack`) ·
query keys completas · stack traces sin sanear.

### Prácticas prohibidas
Grabación de sesión · capturas de pantalla · registro de teclas · seguimiento
publicitario · compartir trazas con terceros · usar la telemetría con fines
comerciales.

---

## 3. Sanitización: cómo se impone, no solo se promete

Hay **cuatro barreras** independientes. Que una falle no basta para que haya fuga.

| # | Barrera | Dónde | Qué hace |
| --- | --- | --- | --- |
| 1 | Lista blanca de claves | `safeAttributes()` | Descarta cualquier atributo cuya clave no esté permitida |
| 2 | Redacción de valores | `sanitizeText()` / `sanitizeUrlPath()` | Redacta el valor **entero** si detecta correo, JWT, `Bearer`, teléfono o secuencia de 12+ dígitos; corta toda query string y fragmento; colapsa segmentos que parezcan identificadores; trunca a 256 caracteres |
| 3 | Procesador saneador | `SanitizingSpanProcessor` | Reescribe lo que escriben las **instrumentaciones oficiales** (que no pasan por la barrera 1). En particular `url.full`, que `FetchInstrumentation` deja **con query string** |
| 4 | Collector | `attributes/redact` + `transform/strip_query` | Repite la limpieza en el servidor, para protegerse de versiones antiguas del frontend todavía cacheadas en algún navegador |

### Los dos vectores concretos que se cerraron

1. **El JWT en la URL del SSE.** `use-admin-notifications.ts` abre
   `…/notifications/stream?token=<JWT>`. El span de conexión **no registra ninguna
   URL**, y si se colara, las barreras 2, 3 y 4 la cortarían en el `?`.
2. **La URL firmada de Cloudinary.** `files.ts` sube directamente a Cloudinary con una
   URL que lleva `api_key` y `signature`. `FetchInstrumentation` la pondría entera en
   `url.full`; la barrera 3 la reduce al camino.

Pruebas: `tests/unit/observability/sanitize.test.ts` y
`tests/integration/observability-api-client.test.ts`, que buscan literalmente el
token, la contraseña y el correo en **todo** lo exportado.

---

## 4. Identificación de sesión

`app.session.id` es un UUID aleatorio guardado en **`sessionStorage`**.

| Propiedad | Valor |
| --- | --- |
| Origen | `crypto.randomUUID()` — no deriva de ningún dato personal |
| Persistencia | Muere al cerrar la pestaña. **No** se usa `localStorage` |
| Rotación | Se descarta en cada cierre de sesión (`rotateTelemetrySessionId()`) |
| Reidentificación | Imposible: no hay tabla que lo asocie a una persona |
| Terceros | No se comparte con nadie |

`app.user.segment` agrupa los cinco roles reales en **cuatro** categorías
(`anonymous`, `patient`, `professional`, `staff`). `ADMIN`, `SUPER_ADMIN` y `CONTADOR`
se funden en `staff` **a propósito**: el equipo administrativo es pequeño y
`CONTADOR` sería en la práctica un identificador personal.

**No existe ningún identificador persistente de usuario** y no debe añadirse sin:
revisión de privacidad, justificación de negocio, política de retención, control de
acceso, seudonimización y consentimiento cuando corresponda.

---

## 5. Retención

| Dato | Retención | Dónde se configura |
| --- | --- | --- |
| Trazas de navegador | **7 días** (recomendado) | Jaeger |
| Trazas de backend | Según su propia política | Fuera de este repositorio |
| Lotes en el gateway | **0**: no se persiste ni se registra el cuerpo | `functions/otel/v1/traces.ts` |
| Trazas en el navegador | Solo en memoria, cola de 512 spans. **Nunca en `localStorage`** | `browser-exporter.ts` |

7 días, y no 30, porque las trazas de navegador tienen mucho volumen y su valor cae en
picado: pasada una semana ya no se está diagnosticando un incidente, se está
acumulando dato personal sin propósito.

---

## 6. Muestreo

| Entorno | Ratio en el navegador |
| --- | --- |
| development | 1.00 |
| test | 0.00 |
| staging | 1.00 |
| production | **0.05** (valor inicial, a ajustar con tráfico real) |

En el Collector, `tail_sampling` conserva **siempre** errores, respuestas 4xx/5xx,
trazas de más de 3 s y las funcionalidades críticas (`auth`, `appointments`, `files`);
del resto conserva el 10 %.

Menos muestreo es también menos dato personal almacenado: el ratio es una medida de
privacidad, no solo de coste.

---

## 7. Accesos y auditoría

| Elemento | Regla |
| --- | --- |
| Interfaz de Jaeger | **Nunca pública.** En local, `127.0.0.1:16686`. En producción, detrás de la red interna y autenticación |
| Collector | Nunca expuesto a internet. Solo lo alcanza el gateway |
| Gateway | Público por necesidad, pero **sin secretos**, solo `POST`, solo `application/json`, máximo 512 KB, y no registra el cuerpo |
| Acceso a trazas | Limitado al equipo técnico que atiende incidencias |
| Auditoría | Cualquier atributo nuevo pasa por revisión: el test de lista blanca falla si no se declara |

---

## 8. Procedimiento de eliminación

Si aparece un dato que no debería estar:

1. **Cortar el flujo**: `NEXT_PUBLIC_OTEL_ENABLED=false` y desplegar. La aplicación
   sigue funcionando exactamente igual (probado en
   `observability-api-client.test.ts`).
2. **Borrar lo almacenado**: purgar el índice de Jaeger del periodo afectado. Con 7
   días de retención, la ventana es pequeña por diseño.
3. **Tapar el agujero**: añadir el patrón a `FORBIDDEN_VALUE_PATTERNS` o la clave a la
   lista de prohibidos, y **añadir una prueba que falle sin el arreglo**.
4. **Reactivar** solo cuando la prueba pase.

---

## 9. Procedimiento ante incidente

1. Determinar **qué** se expuso, **durante cuánto tiempo** y **a quién** (el acceso a
   Jaeger está restringido: el alcance suele ser interno).
2. Aplicar el procedimiento de eliminación de la sección 8.
3. Valorar la obligación de notificación según la normativa aplicable. Al tratarse
   potencialmente de **datos de salud**, el umbral de notificación es bajo: ante la
   duda, notificar.
4. Documentar la causa raíz y la prueba de regresión añadida.

---

## 10. Consentimiento (Fase 35)

`NEXT_PUBLIC_OTEL_ENABLED` **es `false` por defecto, también en producción**.

Encenderla es una decisión explícita que exige antes:

- revisar la política de privacidad vigente del producto y las páginas
  `/privacidad` y `/terminos`,
- determinar si esta telemetría es "estrictamente necesaria" en la jurisdicción donde
  opera el servicio,
- decidir si requiere consentimiento previo.

**No se ha creado ningún banner de consentimiento.** Añadir uno sin conocer la política
existente sería peor que no hacerlo: duplicaría mecanismos y podría contradecir lo ya
publicado. El punto de enganche está listo — basta con no llamar a
`initBrowserTelemetry()` hasta tener el consentimiento, o mantener la bandera apagada.

Compromisos firmes:

- la telemetría **no** se usa para publicidad ni analítica comercial,
- **no** se comparte con anunciantes ni con terceros,
- **no** se hace *fingerprinting*,
- **no** se altera ningún mecanismo de consentimiento existente.

---

## 11. Responsables

| Rol | Responsabilidad |
| --- | --- |
| Equipo de frontend | Mantener las barreras 1–3 y sus pruebas; revisar cada atributo nuevo |
| Quien opere la infraestructura | Barrera 4, retención, acceso a Jaeger, no exponer el Collector |
| Responsable de privacidad del producto | Decidir si la telemetría se enciende y bajo qué base legal |

> **PENDIENTE_CM_OTEL_CONSENTIMIENTO**: nombrar a las personas concretas de esta tabla
> y fechar la revisión de privacidad antes de poner
> `NEXT_PUBLIC_OTEL_ENABLED=true` en producción.

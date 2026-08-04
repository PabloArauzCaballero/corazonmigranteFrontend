# 03 — Catálogo de spans de negocio (Fase 15)

Este documento y `src/observability/core/tracing.constants.ts` **no pueden divergir**:
`tests/unit/observability/business-spans.test.ts` comprueba que todos los nombres del
catálogo aparecen aquí y que aquí no hay ninguno inventado.

El catálogo es **cerrado y pequeño a propósito**. No se declara ningún span que no se
emita realmente: una constante sin uso hace creer que existe una traza que nadie va a
encontrar en Jaeger.

---

## Cómo añadir uno

1. Instrumentar la operación con `runInSpan()`.
2. Añadir la constante a `BUSINESS_SPANS`, con formato `<dominio>.<acción>`.
3. Añadir una fila a este documento.
4. Añadir el caso de prueba.

Prohibido: identificadores, nombres de archivo, datos personales o interpolación en el
nombre del span. Ver [`02-naming-conventions.md`](./02-naming-conventions.md).

---

## `auth.login`

| Campo | Valor |
| --- | --- |
| **Feature** | `auth` |
| **Acción** | `login` |
| **Componente iniciador** | `LoginForm` → `login()` en `src/features/auth/auth.api.ts` |
| **Atributos** | `app.feature`, `app.operation`, `auth.method=password`, `ui.form.name=login`, `auth.result`, `auth.failure.category`, `ui.result` |
| **Eventos** | ninguno |
| **Motivo técnico** | Separar "el login tardó" de "el backend tardó": el span envuelve validación + llamada, y el `http.client` cuelga de él. |
| **Motivo de negocio** | El acceso es el primer punto de fricción del producto; una subida de fallos indica un problema de credenciales, de red o del backend. |
| **Riesgo de privacidad** | **Alto si se hace mal.** El cuerpo lleva correo y contraseña. Ninguno entra en el span. `auth.failure.category` colapsa 401/403/404 en `invalid_credentials` para impedir enumeración de cuentas. |
| **Prueba** | `attributes.test.ts` (antienumeración), `observability-api-client.test.ts` (no se exporta el cuerpo), `observability.spec.ts` (E2E) |

## `auth.logout`

| Campo | Valor |
| --- | --- |
| **Feature** | `auth` · **Acción** `logout` |
| **Componente iniciador** | `useSession().logout` en `src/shared/auth/use-session.tsx` |
| **Atributos** | `app.feature`, `app.operation` |
| **Motivo técnico** | Marca el final de una sesión de telemetría; a partir de aquí `app.session.id` se rota. |
| **Motivo de negocio** | Distinguir una salida voluntaria de una expulsión por sesión caducada. |
| **Riesgo de privacidad** | Bajo. No se registra quién sale. |
| **Prueba** | `tracing-service.test.ts` (modo no-op y activo) |

## `auth.session.expired`

| Campo | Valor |
| --- | --- |
| **Feature** | `auth` · **Acción** `session-expired` |
| **Componente iniciador** | `handleUnauthorizedSession()` en `src/shared/api/client.ts` |
| **Atributos** | `app.feature`, `app.operation` |
| **Motivo técnico** | Un 401 en una petición autenticada expulsa al login. Sin este span, en la traza solo se ve una redirección inexplicable. |
| **Motivo de negocio** | "Se me sale solo" es una de las quejas más difíciles de reproducir; esto la hace medible. |
| **Riesgo de privacidad** | Bajo. Ni token ni identificador. |
| **Prueba** | `observability-api-client.test.ts` |

## `patient.register`

| Campo | Valor |
| --- | --- |
| **Feature** | `auth` · **Acción** `register` |
| **Componente iniciador** | `RegisterPatientForm` → `registerPatient()` |
| **Atributos** | `app.feature`, `app.operation`, `ui.form.name=register-patient`, `ui.result`, `auth.failure.category` |
| **Motivo técnico** | El registro envía nueve campos y falla por validación del backend más a menudo que ningún otro formulario. |
| **Motivo de negocio** | Es el embudo de entrada al producto. |
| **Riesgo de privacidad** | **Alto.** El cuerpo lleva nombre, correo, teléfono, país, ciudad y ocupación. **Ninguno** entra en el span, ni siquiera el país. |
| **Prueba** | `observability-api-client.test.ts` |

## `appointment.request`

| Campo | Valor |
| --- | --- |
| **Feature** | `appointments` · **Acción** `create` \| `create-managed` |
| **Componente iniciador** | `BookingForm` → `createPatientBooking()` / `createManagedBooking()` |
| **Atributos** | `app.feature`, `app.operation`, `ui.component=BookingForm`, `ui.result` |
| **Motivo técnico** | Encadena catálogo, disponibilidad y creación; sin un span envolvente no se sabe cuál de los tres tramos falló. |
| **Motivo de negocio** | **Es la operación central del producto.** |
| **Riesgo de privacidad** | **Muy alto.** `notesForTherapist` es texto libre en el que la persona describe su estado emocional: **dato clínico**. No se registra, ni él ni los identificadores de paciente, terapeuta o servicio. |
| **Prueba** | `tracing-service.test.ts` (anidamiento padre-hijo) |

## `appointment.status.update`

| Campo | Valor |
| --- | --- |
| **Feature** | `appointments` · **Acción** `admin-update` \| `cancel-by-patient` |
| **Componente iniciador** | `RequestsTable` → `updateAdminAppointment()`; `PatientAppointmentsTable` → `cancelPatientAppointment()` |
| **Atributos** | `app.feature`, `app.operation`, `ui.component` |
| **Motivo técnico** | Distinguir quién cambió el estado sin registrar quién es. |
| **Motivo de negocio** | Las cancelaciones son un indicador de negocio y una fuente habitual de incidencias. |
| **Riesgo de privacidad** | **Alto.** `adminNotes` es texto libre sobre la persona atendida, y `appointmentId` identifica un dato clínico. No se registra ninguno. |
| **Prueba** | `route-template.test.ts` (la ruta con `:appointmentId` no genera cardinalidad) |

## `document.upload`

| Campo | Valor |
| --- | --- |
| **Feature** | `files` · **Acción** `upload` |
| **Componente iniciador** | `uploadFile()` en `src/shared/api/files.ts` |
| **Atributos** | `file.type`, `file.extension`, `file.size.bucket`, `upload.strategy`, `ui.result` |
| **Motivo técnico** | Hay **dos** estrategias (directo a Cloudinary y multipart al backend) con perfiles de fallo muy distintos; `upload.strategy` las separa. |
| **Motivo de negocio** | Las subidas fallidas se reportan como "no me deja adjuntar" sin más detalle. |
| **Riesgo de privacidad** | **Alto.** Se prohíben expresamente: `file.name` (puede ser `informe-psicologico-ana.pdf`), la URL firmada de Cloudinary (`api_key` + `signature`), el contenido y el tamaño exacto — que combinado con la hora podría identificar un documento. Solo buckets. |
| **Prueba** | `attributes.test.ts` (buckets, extensión sin nombre) |

## `document.download`

| Campo | Valor |
| --- | --- |
| **Feature** | `downloadables` · **Acción** `download` |
| **Componente iniciador** | `MyDownloadablesLibrary` → `requestDownload()` |
| **Atributos** | `app.feature`, `app.operation`, `ui.component`, `ui.result` |
| **Motivo técnico** | La descarga es una redirección a una URL firmada; sin span no queda rastro de si el paso previo funcionó. |
| **Motivo de negocio** | Acceso a contenido de pago: si falla, es una incidencia comercial. |
| **Riesgo de privacidad** | **Alto.** La respuesta contiene una **URL firmada que da acceso al archivo**. No se registra, ni ella ni el identificador ni el título del recurso. |
| **Prueba** | `observability-api-client.test.ts` (sanitización de URL firmada) |

---

## Operaciones deliberadamente NO instrumentadas

| Operación | Motivo |
| --- | --- |
| Carga de tablas y listados | Ya quedan cubiertos por el span `http.client` y por `route.navigation`. Un span de negocio no añadiría nada. |
| Filtros y paginación | Alta frecuencia, bajo valor diagnóstico. Un span por pulsación sería ruido. |
| Guardado editorial, contabilidad y catálogo | Flujos de administración interna, de bajo volumen. Se instrumentarán cuando exista una necesidad concreta; declararlos ahora sería código muerto. |
| Actualización de perfil | Igual que el anterior: cubierto por `http.client`, sin caso de uso que justifique un span propio hoy. |
| Cada `dispatch` / cambio de estado / render | Prohibido por las reglas 25, 26 y 27. |

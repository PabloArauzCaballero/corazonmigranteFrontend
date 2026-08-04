# Formularios y validación

- **Fecha de evidencia:** 2026-08-03

## 1. Pila

| Pieza | Paquete |
|---|---|
| Estado del formulario | `react-hook-form` `^7.68.0` |
| Esquemas | `zod` `^4.2.1` |
| Puente | `@hookform/resolvers` `^5.2.2` |
| Etiquetas | `@radix-ui/react-label` |
| Campos | `input.tsx`, `textarea.tsx`, `password-input.tsx` |
| Envío | `Button` con `loading` |

## 2. Zod se usa en tres niveles distintos

Conviene distinguirlos porque su modo de fallo es diferente:

| Nivel | Dónde | Qué pasa si falla |
|---|---|---|
| **Entorno** | `config/env.ts` | **La aplicación no arranca** |
| **Sesión** | `shared/auth/session.ts` | `sessionSchema.parse()` **lanza**: no hay sesión |
| **Formularios** | Cada feature | Se muestra el error de campo |

El primero es el más estricto a propósito: es preferible un build fallido a una aplicación desplegada que rompe en la primera petición.

## 3. Prevención de envío duplicado

Resuelta en la primitiva, no en cada formulario:

```tsx
disabled={disabled || loading}
aria-busy={loading || undefined}
```

`Button` con `loading` queda deshabilitado. Cualquier formulario que use el componente hereda la protección.

## 4. Formularios inventariados

| Formulario | Ruta | Complejidad | Fuentes de datos |
|---|---|---|---|
| Login | `/login`, `/admin/login` | Baja | — |
| **Registro de paciente** | `/registro` | **Alta** | 4 catálogos remotos |
| Perfil de paciente | `/paciente/perfil` | Media | Catálogos |
| Perfil de terapeuta | `/terapeuta/perfil` | Media | Catálogos |
| **Reserva** (3 variantes) | 4 rutas | **Alta** | Terapeutas + disponibilidad |
| Creación de usuario | `/admin/usuarios` | Media | — |
| Entidades contables | `/admin/contabilidad/*` | Media | Cuentas, centros de costo |
| Catálogo terapéutico | `/admin/productos/*` | Media | — |
| Elementos CMS | `/admin/contenido/*` | Alta | — |

Los dos de mayor complejidad —registro y reserva— son también los de **mayor valor de negocio** y **no tienen prueba** (`TEST-01`).

## 5. Interacción con el saneado del cliente HTTP

`apiRequest()` aplica `pruneOptionalEmptyValues()` antes de serializar: elimina `null`, `undefined` y **cadenas vacías cuya clave termine** en `Id`, `Ids`, `At`, `Date`, `Until`, `From`, `To`, `Url`, `FileId` u `ObjectKey`.

**Consecuencia práctica para quien escribe formularios:** un campo opcional de fecha o identificador que quede vacío **no se envía**, en vez de enviarse como `""`. Es lo semánticamente correcto y evita un `400` de validación del backend.

Pero implica que **el formulario no controla del todo lo que se envía**. Si alguna vez hiciera falta enviar deliberadamente una cadena vacía en un campo `...Url`, no se podría por esta vía.

## 6. Reintento por validación estricta

Ante un `400` con `property X should not exist`, el cliente elimina esas propiedades y reintenta **una vez**. Es compatibilidad con `ValidationPipe({ forbidNonWhitelisted: true })` de NestJS.

Efecto secundario a conocer: **una petición que tarda el doble sin explicación suele ser esto**. Se instrumenta con `retry_count` precisamente porque era invisible. Los nombres de las propiedades eliminadas **no** se registran: son nombres de campos de formulario.

## 7. Mensajes de error

Los esquemas de zod definen los mensajes. Un mensaje por defecto (`Expected string, received undefined`) **no es un mensaje para una persona usuaria**:

```ts
z.string()
  .min(1, "Escribe tu correo electrónico")
  .email("Ese correo no parece válido")
```

Es especialmente importante en el registro de paciente, donde quien rellena el formulario puede estar en situación de estrés y un mensaje críptico se traduce en abandono.

Para errores de la API, `humanizeApiError()` (86 aristas, el nodo más conectado del sistema) hace la traducción.

## 8. Accesibilidad

Verificado: `Label` de Radix asocia correctamente etiqueta y control; `Button` con `loading` marca `aria-busy`; `login-form.tsx` anuncia errores con región dinámica.

**No verificado:** `aria-invalid`, `aria-describedby` hacia el mensaje de error, movimiento del foco al primer campo con error, e indicación textual de campos obligatorios. Brecha `A11Y-05`. Ver [../accessibility/forms-and-errors.md](../accessibility/forms-and-errors.md).

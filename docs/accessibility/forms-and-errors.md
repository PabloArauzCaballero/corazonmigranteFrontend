# Formularios y mensajes de error

- **Fecha de evidencia:** 2026-08-03

## 1. Base técnica

| Pieza | Implementación |
|---|---|
| Estado del formulario | `react-hook-form` `^7.68.0` |
| Validación | `zod` `^4.2.1` vía `@hookform/resolvers` |
| Etiquetas | `label.tsx` sobre `@radix-ui/react-label` |
| Campos | `input.tsx`, `textarea.tsx`, `password-input.tsx` |
| Envío | `Button` con `loading` → `disabled` + `aria-busy` |

`@radix-ui/react-label` asocia correctamente `<label>` y control mediante `htmlFor`/`id`, incluso cuando el control está anidado. Es la parte que más suele fallar en implementaciones a mano, y aquí está resuelta por la librería. WCAG 1.3.1 y 3.3.2 ✅ en cuanto al etiquetado.

## 2. Prevención de envío duplicado

`Button` con `loading` queda **deshabilitado** además de mostrar el spinner:

```tsx
disabled={disabled || loading}
aria-busy={loading || undefined}
```

Resuelve en la primitiva un problema que de otro modo habría que repetir en cada formulario. Y `aria-busy` desaparece cuando no aplica, en lugar de quedarse como `aria-busy="false"`.

## 3. Anuncio de errores

`features/auth/login-form.tsx` usa `aria-live` o `role="alert"` para los errores de autenticación — es uno de los cinco archivos con regiones dinámicas verificadas.

**Los errores de la API se anuncian por dos vías:**
1. `humanizeApiError()` traduce el error a texto presentable.
2. `toast` con variante `danger` → `role="alert"` + `aria-live="assertive"`.

Un error de envío se anuncia siempre, sin que cada formulario tenga que ocuparse.

## 4. Lo que no está verificado

| # | Requisito | Criterio | Estado |
|---|---|---|---|
| 1 | `aria-invalid="true"` en el campo con error | 4.1.2 | ❌ No verificado |
| 2 | `aria-describedby` que apunte al mensaje de error | 3.3.1 | ❌ No verificado |
| 3 | El error se identifica también sin color | 1.4.1 | ❌ No verificado |
| 4 | El foco se mueve al primer campo con error al enviar | 3.3.1 | ❌ No verificado |
| 5 | Campos obligatorios indicados con texto, no solo con `*` | 3.3.2 | ❌ No verificado |
| 6 | El botón de mostrar/ocultar contraseña tiene nombre accesible | 4.1.2 | ❌ No verificado |

Los puntos 1 y 2 son los de mayor impacto: sin ellos, un lector de pantalla anuncia el campo con normalidad y la persona no se entera de que está en error hasta que revisa la pantalla completa. Es la diferencia entre corregir un formulario en diez segundos o abandonarlo.

Todos recogidos en `A11Y-05`, severidad MEDIUM.

## 5. Formularios inventariados

| Formulario | Ruta | Complejidad |
|---|---|---|
| Login | `/login`, `/admin/login` | Baja — dos campos |
| Registro de paciente | `/registro` | **Alta** — catálogos remotos de país/ciudad, ocupación, profesión, especialidad |
| Perfil de paciente | `/paciente/perfil` | Media |
| Perfil de terapeuta | `/terapeuta/perfil` | Media |
| Reserva (3 variantes) | `/booking`, `/paciente/booking`, `/admin/booking`, `/terapeuta/booking` | **Alta** — disponibilidad dependiente de terapeuta y fecha |
| Creación de usuario | `/admin/usuarios` | Media |
| Entidades contables | `/admin/contabilidad/*` | Media |
| Catálogo terapéutico | `/admin/productos/*` | Media |
| Elementos CMS | `/admin/contenido/*` | Alta |

Los dos de mayor complejidad —registro y reserva— son también los de **mayor valor de negocio** y los que carecen de prueba automatizada. Es la intersección que define la prioridad de `TEST-01`.

## 6. Reglas para formularios nuevos

1. Todo campo con `<label>` visible asociado. Un `placeholder` **no es** una etiqueta: desaparece al escribir.
2. Errores con `aria-invalid` + `aria-describedby` hacia el mensaje.
3. Mensajes que digan qué corregir, no solo que hay un error.
4. Botón de envío con `loading` durante la petición.
5. Al fallar el envío, mover el foco al primer campo con error.
6. Campos obligatorios indicados con texto además del asterisco.
7. Nunca deshabilitar el botón de envío por «formulario inválido» sin explicar qué falta: quien no ve el error no entiende por qué no puede continuar.

## 7. Validación con zod y mensajes

Los esquemas de zod definen los mensajes de error. Un mensaje por defecto de zod (`Expected string, received undefined`) **no es un mensaje para una persona usuaria**. Toda regla debe declarar su mensaje en español:

```ts
z.string().min(1, "Escribe tu correo electrónico").email("Ese correo no parece válido")
```

Es especialmente importante en el registro de paciente, donde la persona puede estar en una situación de estrés y un mensaje críptico se traduce directamente en abandono.

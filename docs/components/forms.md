# Componentes de formulario

- **Fecha de evidencia:** 2026-08-03

## 1. Los cuatro componentes

| Componente | Base | Estado |
|---|---|---|
| [input.tsx](../../src/shared/ui/input.tsx) | `<input>` con `@tailwindcss/forms` | Activo |
| [textarea.tsx](../../src/shared/ui/textarea.tsx) | `<textarea>` | Activo |
| [label.tsx](../../src/shared/ui/label.tsx) | `@radix-ui/react-label` | Activo |
| [password-input.tsx](../../src/shared/ui/password-input.tsx) | `input` + alternar visibilidad | Activo |

**Ninguno tiene prueba.** Brecha `TEST-02`.

## 2. `Label` de Radix — por qué importa

`@radix-ui/react-label` asocia correctamente etiqueta y control mediante `htmlFor`/`id`, incluso cuando el control está anidado dentro de la etiqueta.

Es la parte que más suele fallar en implementaciones a mano, y aquí la resuelve la librería. WCAG 1.3.1 y 3.3.2 ✅ en cuanto al etiquetado.

**Un `placeholder` no es una etiqueta.** Desaparece al escribir, y quien vuelve a un formulario a medias pierde la referencia de qué iba en cada campo.

## 3. `@tailwindcss/forms`

Normaliza el aspecto de los controles nativos entre navegadores sin renunciar a su semántica. Es la elección correcta frente a reimplementar `<select>` o `<checkbox>` con `<div>`: los controles nativos ya son accesibles, funcionan con teclado y se integran con el autocompletado del navegador.

## 4. `password-input.tsx`

Alterna entre `type="password"` y `type="text"`.

**Requisitos que no se han verificado:**

| Requisito | Estado |
|---|---|
| El botón de alternar es enfocable con `Tab` | ❌ No verificado |
| Tiene nombre accesible («Mostrar contraseña» / «Ocultar contraseña») | ❌ No verificado |
| El nombre cambia según el estado | ❌ No verificado |
| El botón es `type="button"` (no envía el formulario) | ❌ No verificado |

El último es el error clásico: un `<button>` dentro de un `<form>` sin `type="button"` **envía el formulario** al pulsarlo. Recogido en `A11Y-05`.

## 5. Integración con `react-hook-form`

```tsx
const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
  resolver: zodResolver(esquema)
});

<Label htmlFor="email">Correo electrónico</Label>
<Input id="email" {...register("email")} aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined} />
{errors.email && <p id="email-error" role="alert">{errors.email.message}</p>}

<Button type="submit" loading={isSubmitting}>Entrar</Button>
```

Los atributos `aria-invalid` y `aria-describedby` del ejemplo son **la práctica correcta**, no una descripción de lo que hoy hace cada formulario: no se ha verificado que todos los apliquen (`A11Y-05`).

## 6. Prevención de envío duplicado

`Button` con `loading` queda **deshabilitado** además de mostrar el spinner. Basta pasar `loading={isSubmitting}` de `react-hook-form`; no hace falta lógica adicional en cada formulario.

## 7. Lo que no existe

| Componente | Estado | Consecuencia |
|---|---|---|
| `Select` compartido | ❌ | Cada feature usa `<select>` nativo o el suyo |
| `Checkbox` / `Radio` compartidos | ❌ | Igual |
| `DatePicker` compartido | ❌ | Relevante: **la reserva de citas necesita selección de fecha** |
| `FormField` (etiqueta + control + error) | ❌ | Cada formulario repite el patrón, y con él el riesgo de omitir `aria-describedby` |

**La ausencia de `FormField` es la más significativa.** Un componente que agrupara etiqueta, control y mensaje de error garantizaría por construcción la asociación ARIA correcta en todos los formularios. Hoy depende de que cada uno lo haga bien, y no se ha verificado que así sea.

Registrado como propuesta, no implementada: sería `CAMBIO DE PRODUCTO`.

## 8. Reglas

1. Siempre `<Label>` asociado; nunca solo `placeholder`.
2. `aria-invalid` y `aria-describedby` cuando hay error.
3. `loading={isSubmitting}` en el botón de envío.
4. Mensajes de error en el esquema zod, en español y accionables.
5. Preferir controles nativos a reimplementaciones.
6. Todo botón dentro de un `<form>` que no envíe debe llevar `type="button"`.

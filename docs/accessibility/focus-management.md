# Gestión del foco

- **Fecha de evidencia:** 2026-08-03

## 1. Foco visible

Dos capas complementarias en [globals.css](../../src/app/globals.css):

**Capa 1 — utilidad explícita.** La clase `.focus-ring` se aplica en `Button` y otros controles:
```css
.focus-ring { @apply … focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background; }
```

**Capa 2 — red de seguridad global:**
```css
a:focus-visible, button:focus-visible, [role="button"]:focus-visible, summary:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
  border-radius: 0.5rem;
}
```

La segunda existe porque la primera no se aplicaba en todas partes. El comentario del código: *«Sin esto, buena parte de los enlaces con estilos propios (navbar, footer, tarjetas de la landing) no mostraban ninguna señal al navegar con el teclado.»*

Se usa `:focus-visible` y no `:focus`: el anillo aparece al navegar con teclado, no al pulsar con el ratón. Es el comportamiento esperado y evita que alguien lo elimine por motivos estéticos.

El color del anillo es `hsl(var(--ring))` = `0 82% 28%` — el mismo rojo de marca que `--primary`.

## 2. Restauración de foco en `Modal`

```ts
const previouslyFocused = document.activeElement as HTMLElement | null;
const panel = panelRef.current;
if (panel) {
  const [firstFocusable] = focusablesIn(panel);
  (firstFocusable ?? panel).focus();
}
// … al cerrar: previouslyFocused?.focus()
```

Comentario del código: *«Se recuerda quién tenía el foco para devolvérselo al cerrar: sin esto, al cerrar un diálogo el foco vuelve al `<body>` y quien navega con teclado o lector de pantalla pierde por completo su posición en la página.»*

Es el requisito que más a menudo se omite en implementaciones de diálogos.

## 3. Trampa de foco en `Modal`

```ts
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");
```

Con filtrado adicional por visibilidad:
```ts
.filter((el) => el.offsetParent !== null || el === document.activeElement)
```

Ese filtro importa: un elemento con `display: none` sigue apareciendo en `querySelectorAll` y, sin filtrar, el foco «desaparecería» al llegar a él. La excepción `|| el === document.activeElement` cubre el caso de un elemento con posicionamiento fijo, donde `offsetParent` es `null` aunque sea visible.

Si no hay ningún enfocable, `event.preventDefault()` impide que `Tab` escape del panel.

## 4. Enlace de salto

El foco se traslada a `<main id="contenido-principal" tabIndex={-1}>`. El `tabIndex={-1}` es lo que permite enfocar por programa un elemento que no es interactivo.

## 5. Verificación pendiente

| Componente | Riesgo | Estado |
|---|---|---|
| `Modal` | Alto (lógica compleja) | ✅ Implementado, ❌ sin prueba automatizada |
| `confirm-dialog.tsx` | Alto | ❌ **No verificado** — es un componente distinto de `Modal` y no se ha comprobado que replique el mismo tratamiento |
| Overlay de tutoriales | Medio | ❌ No verificado |
| Menú móvil de `DashboardShell` | Medio | ❌ No verificado |

`confirm-dialog.tsx` es el hallazgo más relevante de esta página: se comporta como un diálogo modal y, si no implementa trampa y restauración de foco, incumpliría WCAG 2.1.2 y 2.4.3 en un componente de uso frecuente (confirmaciones de borrado en las tablas de administración).

Recogido dentro de `A11Y-01`. Verificarlo requiere ejecutar la aplicación; corregirlo, si procede, sería `CAMBIO DE PRODUCTO`.

## 6. Regla para código nuevo

Todo componente que superponga contenido (modal, panel lateral, menú desplegable, popover, overlay de tutorial) **debe**:

1. mover el foco al abrirse,
2. confinar `Tab` mientras está abierto,
3. cerrarse con `Escape`,
4. devolver el foco al elemento que lo abrió.

La forma más segura de cumplirlo es reutilizar `Modal` en lugar de escribir otro contenedor superpuesto.

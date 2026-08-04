# Informe de accesibilidad

- **Fecha de evidencia:** 2026-08-03
- **Estándar aplicado:** WCAG 2.2 nivel AA
- **Método:** revisión manual de código sobre `src/app/globals.css`, `src/shared/ui/*`, layouts y shells

> ⚠️ **Limitación declarada del método.** El repositorio **no tiene ninguna herramienta de accesibilidad automatizada** — sin `axe-core`, `jest-axe`, `@axe-core/playwright` ni Lighthouse. Esta auditoría es **estática y manual**: verifica que el código implementa los mecanismos correctos, pero **no** sustituye a una prueba con lector de pantalla real ni a una medición de contraste sobre la interfaz renderizada. Las conclusiones sobre contraste, en particular, están marcadas como no verificadas. Brecha `A11Y-01`.

---

## 1. Resumen

| Área | Valoración | Detalle |
|---|---|---|
| Gestión del foco | 🟢 **Muy buena** | Trampa y restauración de foco correctas en `Modal` |
| Regiones dinámicas | 🟢 **Muy buena** | `aria-live` con urgencia diferenciada en `toast` |
| Movimiento reducido | 🟢 Buena | Tres bloques `prefers-reduced-motion` |
| Navegación por teclado | 🟢 Buena | Skip-link funcional, foco visible global |
| Zoom y reflujo | 🟢 Correcta | `maximumScale` deliberadamente sin límite |
| Estructura semántica | 🟡 Aceptable | `<h1>` vía `PageHeader`; jerarquía interna no verificada |
| Formularios y errores | 🟡 Parcial | `Label` de Radix; asociación de errores no verificada en todos los formularios |
| Contraste | 🟡 **No verificado** | Sin medición automatizada |
| Objetivos táctiles | 🟡 Parcial | `Button` `sm` mide 36 px de alto |
| Prueba automatizada | 🔴 **Ausente** | Ninguna |

**El nivel de cuidado en accesibilidad de este código está muy por encima de lo habitual.** Los comentarios citan criterios WCAG concretos por su número, lo que indica decisiones informadas y no accidentales.

---

## 2. Lo que está bien resuelto

### 2.1 Enlace de salto — WCAG 2.4.1 (Bypass Blocks) ✅

```tsx
// app/layout.tsx — primer elemento del <body>
<a className="skip-link" href="#contenido-principal">Saltar al contenido principal</a>
```

**Verificado que el destino existe en los dos shells:**

| Shell | Implementación |
|---|---|
| `features/landing/public-shell.tsx:232` | `<main id="contenido-principal" tabIndex={-1}>` |
| `features/dashboard/sidebar.tsx:360` | `id="contenido-principal"` |

El `tabIndex={-1}` es imprescindible: sin él, muchos navegadores mueven el *scroll* pero **no el foco**, y quien usa lector de pantalla sigue oyendo el menú. Está bien hecho.

El CSS lo mantiene fuera de pantalla (`top: -100%`) hasta que recibe foco con `Tab`.

### 2.2 Foco visible — WCAG 2.4.7 (Focus Visible) ✅

Dos capas en `globals.css`:

```css
.focus-ring { @apply … focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 …; }

a:focus-visible, button:focus-visible, [role="button"]:focus-visible, summary:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
  border-radius: 0.5rem;
}
```

La segunda es una red de seguridad global. El comentario del código explica por qué se añadió: *«Sin esto, buena parte de los enlaces con estilos propios (navbar, footer, tarjetas de la landing) no mostraban ninguna señal al navegar con el teclado.»*

Usa `:focus-visible` y no `:focus`, así que el anillo no aparece al hacer clic con el ratón.

### 2.3 Modal — WCAG 2.1.2, 2.4.3, 4.1.2 ✅

El componente mejor resuelto del sistema:

| Requisito | Implementación |
|---|---|
| Foco inicial | Primer enfocable del panel, o el propio panel |
| **Restauración de foco** | Guarda `document.activeElement` y lo restaura al cerrar |
| **Trampa de foco** | `Tab`/`Shift+Tab` circulan dentro del panel |
| Cierre con `Escape` | ✅ |
| Etiquetado | `useId()` → `aria-labelledby` + `aria-describedby` |
| Elementos ocultos | Filtrado por `offsetParent !== null` |

La restauración de foco es el requisito que más a menudo se omite, y aquí está implementado con su justificación escrita.

### 2.4 Toasts — WCAG 2.2.1 y 4.1.3 ✅

**Pausa del auto-cierre.** Los 6 000 ms se detienen mientras el puntero **o el foco** están sobre el aviso. El código cita WCAG 2.2.1 (Timing Adjustable) explícitamente.

**Urgencia diferenciada:**

| Variante | `role` | `aria-live` |
|---|---|---|
| `danger`, `warning` | `alert` | `assertive` |
| `info`, `success` | `status` | `polite` |

El comentario: *«Solo los avisos de error interrumpen al lector de pantalla; el resto se anuncian cuando la persona termina lo que esté leyendo.»* Es exactamente el criterio correcto — el abuso de `assertive` es uno de los errores más frecuentes en aplicaciones React.

### 2.5 Zoom — WCAG 1.4.4 (Resize Text) ✅

```ts
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // maximumScale se deja libre a propósito — limitar el zoom rompe WCAG 1.4.4.
  …
};
```

Una decisión deliberada y documentada, frente a la práctica común de `maximum-scale=1`.

### 2.6 Movimiento reducido — WCAG 2.3.3 ✅

Tres bloques `@media (prefers-reduced-motion: reduce)` en `globals.css` (líneas 36, 325 y 378). El primero desactiva `scroll-behavior: smooth`, con esta justificación: *«El scroll suave es una animación más: para quien pidió reducir movimiento en el sistema, un salto de ancla largo puede provocar mareo.»*

### 2.7 Estados de carga y ocupado ✅

- `Button` con `loading` marca `aria-busy` y **deshabilita** el control.
- Todos los iconos decorativos llevan `aria-hidden="true"`.
- `GlobalLoadingBar` usa `aria-live`.

### 2.8 Idioma — WCAG 3.1.1 ✅

`<html lang="es">` en el layout raíz.

---

## 3. Hallazgos abiertos

| ID | Hallazgo | Criterio WCAG | Severidad | Detalle |
|---|---|---|---|---|
| A11Y-01 | **Sin prueba automatizada de accesibilidad** | — | **HIGH** | Nada impide una regresión. La lógica de foco del `Modal` es compleja y no tiene red de seguridad |
| A11Y-02 | **Contraste no verificado** | 1.4.3 (AA) | **MEDIUM** | Sin medición. Combinaciones a comprobar: `text-muted-foreground` (`31 7% 39%`) sobre `bg-card`; `Badge` `warning` (`amber-800` sobre `amber-100`); `ForbiddenState` (`amber-900/80` sobre `amber-50`) |
| A11Y-03 | Objetivo táctil de `Button size="sm"` | 2.5.8 (AA) | LOW | 36 px de alto: cumple el mínimo de 24 px de AA, por debajo de los 44 px de AAA |
| A11Y-04 | Jerarquía de encabezados no verificada dentro de las pantallas | 1.3.1 | MEDIUM | `PageHeader` garantiza el `<h1>`; no se verificó que no haya saltos `h1 → h3` |
| A11Y-05 | Asociación de errores de formulario no verificada en todos los formularios | 3.3.1, 3.3.3 | MEDIUM | Se usa `Label` de Radix; falta confirmar `aria-describedby` y `aria-invalid` en cada campo con error |
| A11Y-06 | `Badge` sin semántica | 1.4.1 | LOW | Es un `<div>` sin rol. Aceptable **mientras** el texto comunique el estado por sí solo |
| A11Y-07 | Tablas sin `<caption>` ni `scope` verificados | 1.3.1 | MEDIUM | `DataTable` genera `<table>`; no se verificó `scope="col"` en los `<th>` |
| A11Y-08 | Modo oscuro configurado pero inactivo | — | LOW | `darkMode: ["class"]` en Tailwind, `colorScheme: "light"` fijo. Sin incumplimiento, pero el trabajo está a medias |

**Ninguno se corrige en este plan.** Todos son `CAMBIO DE PRODUCTO`.

---

## 4. Verificación manual pendiente

Lo que una auditoría estática **no puede** determinar y debe comprobarse con la aplicación en ejecución:

1. Recorrido completo con `Tab` de cada journey crítico, sin ratón.
2. Lectura con NVDA/JAWS (Windows) y VoiceOver (macOS/iOS).
3. Zoom al 200 % y al 400 % comprobando reflujo (WCAG 1.4.10).
4. Medición de contraste sobre la interfaz renderizada.
5. Navegación solo con teclado en el overlay de tutoriales.
6. Comportamiento con `prefers-reduced-motion` activado en el sistema.

---

## 5. Propuesta de instrumentación

`INSTRUMENTACIÓN SEGURA` — **no implementada aquí**, requiere añadir dependencias:

| Herramienta | Ámbito | Coste |
|---|---|---|
| `jest-axe` | Componentes compartidos en las pruebas existentes | Bajo |
| `@axe-core/playwright` | Journeys completos en los specs E2E existentes | Bajo |
| Lighthouse CI | Puntuación por ruta en el pipeline | Medio |

La primera es la de mejor relación coste/beneficio: ya existen Jest y Testing Library, y añadiría cobertura sobre `Modal`, `Button`, `toast` y `DataTable` — donde vive la lógica de accesibilidad que hoy nada protege.

---

Ver también: [standard-and-scope.md](standard-and-scope.md) · [keyboard.md](keyboard.md) · [focus-management.md](focus-management.md) · [screen-readers.md](screen-readers.md) · [forms-and-errors.md](forms-and-errors.md) · [color-and-contrast.md](color-and-contrast.md)

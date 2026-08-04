# Catálogo de componentes compartidos

- **Fecha de evidencia:** 2026-08-03
- **Ubicación:** [src/shared/ui/](../../src/shared/ui/) — 19 archivos
- **Prioridad de documentación:** número de aristas en Graphify

> **No hay Storybook.** Este catálogo es la única referencia de los componentes compartidos. Incorporar Storybook sería `CAMBIO DE PRODUCTO`; ver [deprecation.md](deprecation.md).

---

## 1. `Button` — 52 aristas

`src/shared/ui/button.tsx` · Estado: **activo** · La primitiva de acción del sistema.

| Prop | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `variant` | `default \| secondary \| outline \| ghost \| destructive` | `default` | Intención visual |
| `size` | `sm \| md \| lg \| icon` | `md` | Altura y espaciado |
| `asChild` | `boolean` | `false` | Delega el render al hijo vía `Radix Slot` — para `<Link>` con aspecto de botón |
| `loading` | `boolean` | `false` | Muestra un spinner, **deshabilita** el botón y marca `aria-busy` |
| …resto | `React.ButtonHTMLAttributes` | — | `onClick`, `type`, `disabled`, `aria-*` |

**Alturas:** `sm` 36 px · `md` 44 px · `lg` 48 px · `icon` 40×40 px.

**Accesibilidad verificada:**
- `loading` implica `disabled` — impide el doble envío sin código adicional en cada formulario.
- `aria-busy={loading || undefined}` — el atributo desaparece cuando no aplica, en vez de quedar como `aria-busy="false"`.
- El spinner lleva `aria-hidden="true"`.
- Usa la clase `.focus-ring`, que aporta `focus-visible:ring-2` con `ring-offset`.
- `md`, `lg` e `icon` cumplen el objetivo táctil de 24×24 px de WCAG 2.5.8. **`sm` mide 36 px de alto** — cumple el mínimo, pero queda por debajo de los 44 px recomendados por WCAG 2.5.5 (AAA).

**Uso con `asChild`:**
```tsx
<Button asChild variant="outline">
  <Link href="/admin/usuarios">Ver usuarios</Link>
</Button>
```
Es la forma correcta de navegar: usar `onClick={() => router.push(...)}` en un `<button>` rompe «abrir en pestaña nueva» y la semántica de enlace.

---

## 2. `Card` / `CardContent` — 37 + 37 aristas

`src/shared/ui/card.tsx` · Estado: **activo**

Contenedor visual base. `Card` aporta borde, radio y fondo (`bg-card`); `CardContent` el relleno. Se combinan con `PageHeader` en casi todas las pantallas de portal y son el soporte de los cuatro estados de `state.tsx`.

---

## 3. `PageHeader` — 42 aristas

`src/shared/ui/page-header.tsx` · Estado: **activo**

| Prop | Tipo | Obligatoria | Descripción |
|---|---|---|---|
| `title` | `string` | ✅ | Se renderiza como el `<h1>` de la página |
| `eyebrow` | `string` | — | Antetítulo en versales |
| `description` | `string` | — | Texto de apoyo |
| `actions` | `ReactNode` | — | Botones alineados a la derecha |

**Es la fuente del `<h1>` de cada pantalla.** Toda página de portal que lo use tiene un encabezado de nivel 1 correcto; una que no lo use, probablemente no lo tenga. Ver [accessibility/screen-readers.md](../accessibility/screen-readers.md).

**Detalle de diseño relevante:** lleva incrustados tres `data-tutorial-id` (`encabezadoPagina`, `tituloPagina`, `accionesPagina`). El comentario del código explica la decisión: al usarlo casi todas las pantallas, cualquier tutorial puede resaltar el título o las acciones **sin anotar cada página por separado**.

---

## 4. `state.tsx` — los cuatro estados de interfaz

`src/shared/ui/state.tsx` · Estado: **activo**

| Componente | Props | Icono | Uso |
|---|---|---|---|
| `LoadingState` | `title?` (por defecto «Cargando información») | `Loader2` girando | `ClientRoleGuard`, carga de datos |
| `EmptyState` | `title`, `description` (ambas obligatorias) | `Inbox` | Sin resultados; lo usa `DataTable` |
| `ErrorState` | `title`, `description`, `actionLabel?`, `onAction?` | `AlertTriangle` | Fallos de carga; permite reintentar |
| `ForbiddenState` | — (texto fijo) | `ShieldAlert` | Rol insuficiente |

Todos los iconos llevan `aria-hidden="true"`. `ErrorState` solo pinta el botón si se pasan **ambas** `actionLabel` y `onAction`.

`ForbiddenState` tiene texto fijo: *«Tu cuenta no tiene permisos para ver esta sección. Si crees que esto es un error, contacta a administración.»* No es configurable — el mensaje debe ser idéntico en toda la aplicación.

---

## 5. `DataTable<T>`

`src/shared/ui/data-table.tsx` · Estado: **activo** · Genérico

| Prop | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `columns` | `DataTableColumn<T>[]` | — | `{ key, header, render(row), className? }` |
| `data` | `T[] \| undefined \| null` | — | Filas |
| `getRowKey` | `(row: T) => string` | — | Clave estable de React |
| `emptyTitle` | `string` | «Sin resultados» | Título del estado vacío |
| `emptyDescription` | `string` | «Ajusta la búsqueda o los filtros…» | Descripción |

**Defensa incorporada:** `const rows = Array.isArray(data) ? data : [];`. El comentario del código lo justifica: evita el fallo `Cannot read properties of undefined (reading 'length')` cuando los datos aún no llegaron o el endpoint falló. Acepta `undefined` y `null` **a propósito**, para que el consumidor pueda pasar `query.data` sin comprobaciones.

**`DataTableSkeleton`** — props `columns` (5) y `rows` (6). Anchos de celda variables y `animation-delay` escalonado por celda: un esqueleto con todas las celdas idénticas y sincronizadas se percibe como un error de render.

---

## 6. `Modal`

`src/shared/ui/modal.tsx` · Estado: **activo** · `"use client"`

| Prop | Tipo | Obligatoria |
|---|---|---|
| `open` | `boolean` | ✅ |
| `onClose` | `() => void` | ✅ |
| `title` | `string` | ✅ |
| `description` | `string` | — |
| `children` | `ReactNode` | ✅ |

**Es el componente con mejor accesibilidad del sistema.** Implementación verificada:

| Requisito | Implementación |
|---|---|
| Foco inicial | Al primer elemento enfocable del panel, o al panel |
| **Restauración de foco** | Guarda `document.activeElement` al abrir y lo devuelve al cerrar. El comentario: *«sin esto, al cerrar un diálogo el foco vuelve al `<body>` y quien navega con teclado o lector de pantalla pierde por completo su posición»* |
| **Trampa de foco** | `Tab` y `Shift+Tab` circulan dentro del panel. *«sin ella se puede tabular hasta los controles que quedan detrás del overlay»* |
| Cierre con `Escape` | ✅ |
| Etiquetado | `useId()` para `aria-labelledby` y `aria-describedby` |
| Elementos ocultos | El selector de enfocables filtra por `offsetParent !== null` |

Cumple WCAG 2.1.2 (sin trampa de teclado), 2.4.3 (orden de foco) y 4.1.2 (nombre y rol).

---

## 7. `toast.tsx` — `ToastProvider` + `useToast()`

`src/shared/ui/toast.tsx` · Estado: **activo** · `"use client"`

```ts
type Toast = { id: string; title: string; description?: string; variant?: "info" | "success" | "warning" | "danger" };
```

Se consume con `const toast = useToast(); toast({ title, description, variant })`.

**Accesibilidad — dos decisiones explícitas y correctas:**

1. **Pausa del auto-cierre.** Los 6 000 ms se detienen mientras el puntero **o el foco** están sobre el aviso (`onMouseEnter`/`onMouseLeave` y `onFocusCapture`/`onBlurCapture`). El código cita **WCAG 2.2.1 (Timing Adjustable)**.
2. **Urgencia diferenciada.** `danger` y `warning` usan `role="alert"` + `aria-live="assertive"`; `info` y `success`, `role="status"` + `aria-live="polite"`. El comentario: *«Solo los avisos de error interrumpen al lector de pantalla; el resto se anuncian cuando la persona termina lo que esté leyendo.»* Todos llevan `aria-atomic="true"`.

---

## 8. `SmartImage`

`src/shared/ui/smart-image.tsx` · Estado: **activo** · **Único componente de `shared/ui` con prueba unitaria** (`tests/unit/smart-image.test.tsx`)

| Prop | Tipo | Por defecto | Descripción |
|---|---|---|---|
| `src` | `string \| null \| undefined` | — | Origen; se valida antes de usar |
| `alt` | `string` | — | **Obligatoria** |
| `fallbackSrc` | `string` | Imagen genérica de Cloudinary | Respaldo |
| `aspectRatio` | `string` | — | p. ej. `"16 / 9"`. **Evita CLS** |
| `priority` | `boolean` | `false` | Carga inmediata para el hero |
| `className`, `imgClassName`, `rounded` | `string` | — | Estilos |
| `onLoaded`, `onErrored` | `() => void` | — | Callbacks |

Existe porque `images.unoptimized: true` deja sin `next/image`. Aporta:

- `isValidSrc()` rechaza `null`, `undefined`, `about:blank` y cadenas vacías; exige `http(s)://`, `//`, `/` o `data:`.
- Fallback que se intenta **una sola vez** — sin bucles de error.
- Estado `loading | loaded | error` con placeholder shimmer.
- `aspectRatio` reserva el espacio y evita desplazamiento de layout.

**Patrón de React que merece atención:** el reinicio ante cambio de `src` se hace **durante el render**, no en un `useEffect`. El comentario explica el porqué: con `useEffect` había un render intermedio en el que el `<img>` seguía apuntando a la imagen anterior ya marcada como cargada, y **se veía la foto vieja durante un frame**. Es la técnica oficial de React para estado derivado de props.

---

## 9. `Badge`

`src/shared/ui/badge.tsx` · Estado: **activo**

Variantes: `default`, `secondary`, `muted`, `success`, `warning`, `danger`.

⚠️ **Es puramente visual.** Renderiza un `<div>` sin rol ni texto alternativo: para un lector de pantalla, un badge «Confirmada» en verde y otro «Cancelada» en rojo se leen solo por su texto. Es aceptable **siempre que el texto por sí solo comunique el estado** — lo cual se cumple en los usos revisados. Si alguna vez se usa un badge solo con color, incumpliría WCAG 1.4.1. Ver [accessibility/color-and-contrast.md](../accessibility/color-and-contrast.md).

---

## 10. Componentes de formulario

| Componente | Base | Notas |
|---|---|---|
| `input.tsx` | `<input>` + `@tailwindcss/forms` | Estilo unificado |
| `textarea.tsx` | `<textarea>` | Estilo unificado |
| `label.tsx` | `@radix-ui/react-label` | Asociación correcta con el control |
| `password-input.tsx` | `input` + alternar visibilidad | El botón debe ser enfocable y estar etiquetado |

Se integran con `react-hook-form` + `zod`. Ver [forms.md](forms.md).

---

## 11. Resto de componentes

| Componente | Papel | Estado |
|---|---|---|
| `auth-visual-layout.tsx` | Estructura de dos columnas para login y registro | Activo |
| `confirm-dialog.tsx` | `ConfirmProvider` + confirmación imperativa | Activo |
| `error-boundary.tsx` | Frontera de error de componente | Activo |
| `global-loading-bar.tsx` | Barra de progreso global | Activo |
| `table-shell.tsx` | Marco de tabla con desplazamiento | Activo |
| `fontawesome.tsx` | Puente hacia iconos FontAwesome | **Revisar** — el sistema usa `lucide-react`; conviven dos familias de iconos |

---

## 12. Cobertura de pruebas

| Componente | Prueba | Riesgo |
|---|---|---|
| `SmartImage` | ✅ `tests/unit/smart-image.test.tsx` | Bajo |
| `Button` (52 aristas) | ❌ | **Alto** |
| `Modal` (foco, `Escape`, trampa) | ❌ | **Alto** — lógica de accesibilidad compleja y sin red de seguridad |
| `DataTable` (defensa ante `null`) | ❌ | Medio |
| `toast` (pausa, `aria-live`) | ❌ | Medio |
| `state.tsx` | ❌ | Bajo |
| `PageHeader`, `Card`, `Badge` | ❌ | Bajo |

**18 de 19 componentes compartidos no tienen prueba.** Entre ellos, los cinco de mayor centralidad del grafo. Brecha `TEST-02`, severidad **HIGH**. Ver [testing/component-tests.md](../testing/component-tests.md).

## Reglas de composición

Ver [composition-rules.md](composition-rules.md).

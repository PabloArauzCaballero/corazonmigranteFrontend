# Sistema de diseño responsivo

> Referencia de mantenimiento. Antes de resolver un problema responsivo en una pantalla
> concreta, comprueba si ya está resuelto aquí. **La regla del sistema es centralizar:
> se corrige la primitiva, no la pantalla.**

Fecha de evidencia: 2026-08-03 · Stack: Next.js 15.4.7 · Tailwind 3.4.19 · React 19.2

---

## 1. Escala de breakpoints

Fuente única: [`src/shared/ui/breakpoints.ts`](../src/shared/ui/breakpoints.ts).

| Nombre | Ancho | Uso en el sistema |
|---|---:|---|
| *(base)* | 0–639 | Móvil. Punto de partida: **todo se escribe primero para este rango.** |
| `sm` | 640 | Recupera espaciados y tamaños plenos (paddings de tarjeta, alturas de cabecera) |
| `md` | 768 | **Umbral canónico compacto ↔ amplio.** Tablas pasan de tarjetas a columnas; `PageHeader` pasa a fila |
| `lg` | 1024 | La barra lateral del portal pasa a fija (`lg:pl-64`) |
| `xl` | 1280 | Navegación completa de la landing |
| `2xl` | 1536 | — |

Ancho máximo de contenido: **1200 px** (`container.screens["2xl"]` en
`tailwind.config.ts`). En pantallas ultraanchas el contenido se centra; **no se estira**.

### Reglas

1. **Elige el breakpoint por el contenido, no por el dispositivo.** El punto correcto es
   aquel en el que el contenido deja de caber, no el ancho de un teléfono concreto.
2. **Reutiliza antes de crear.** Solo existe un breakpoint arbitrario en todo el
   proyecto — `min-[380px]` en los bloques de marca, donde el descriptivo se oculta —
   y está justificado en el propio código.
3. **Móvil primero.** `p-4 sm:p-6`, nunca `p-6 max-sm:p-4`.
4. **Nunca detectes el dispositivo.** Si de verdad hace falta JavaScript, usa
   [`useMediaQuery`](../src/shared/hooks/use-media-query.ts), que se basa en
   `useSyncExternalStore` y no rompe la hidratación del export estático.

---

## 2. Contenedores y espaciado

| Necesidad | Solución |
|---|---|
| Ancho de página | `.container` de Tailwind (centrado, `padding: 1rem`, tope 1200 px) |
| Contenido principal del portal | `container py-6 sm:py-8 md:py-10` en `DashboardShell` |
| Tarjeta | `Card` / `CardHeader` / `CardContent` — padding `p-4 sm:p-6` |
| Bloque de tabla | `TableShell` — padding `px-3 sm:px-5` |
| Longitud de línea legible | `.measure` (68ch) |

**No definas anchos de página en una pantalla concreta.** Si necesitas un ancho distinto,
es señal de que falta una variante en el contenedor compartido.

---

## 3. Utilidades responsivas

Declaradas en [`src/app/globals.css`](../src/app/globals.css), sección
«SISTEMA RESPONSIVO».

### 3.1 Áreas seguras

| Clase | Efecto |
|---|---|
| `.pb-safe` | Reserva `env(safe-area-inset-bottom)` |
| `.pt-safe` | Reserva `env(safe-area-inset-top)` |
| `.px-safe` | Reserva los insets laterales |
| `.pb-safe-4` | `1rem` + inset inferior (suma, no pisa) |

Aplícalas a **todo panel anclado a un borde**: cajones, modales, barras fijas. Valen 0
en dispositivos sin recortes, así que son seguras de usar siempre.

### 3.2 Alto de ventana

| Clase | Cuándo |
|---|---|
| `.min-h-dvh` / `.h-dvh` / `.max-h-dvh` | Siempre que la altura determine si un control es **alcanzable** |

`100vh` mide la ventana con las barras del navegador **retraídas**: en móvil el pie de
un panel a pantalla completa cae fuera del área visible. Usa `dvh` para paneles,
cajones y modales. `min-h-screen` sigue siendo aceptable en fondos decorativos.

### 3.3 Desplazamiento horizontal deliberado

| Clase | Efecto |
|---|---|
| `.scroll-x-contained` | `overflow-x:auto` + `overscroll-behavior-x: contain` |
| `.scroll-x-hint` | Sombras laterales que se desvanecen en cada extremo — **sin JavaScript** |

Úsalas juntas cuando el desplazamiento lateral sea la respuesta correcta (una tabla
ancha en tablet, una tira de píldoras de sección). `contain` impide que el gesto
arrastre la página o dispare el «volver atrás» del navegador.

### 3.4 Objetivos táctiles

| Clase | Efecto |
|---|---|
| `.touch-target` | Amplía la zona sensible a 44 px **solo** con `pointer: coarse`, sin cambiar ninguna medida visible |

Ya aplicada automáticamente por `Button` en los tamaños `sm` e `icon`. Añádela a
cualquier control compacto propio.

| Referencia | Valor |
|---|---:|
| WCAG 2.2 AA (2.5.8) | 24 × 24 px |
| Objetivo propio del sistema | 44 × 44 px |

### 3.5 Tipografía fluida

| Clase | Rango | Sustituye a |
|---|---|---|
| `.text-fluid-title` | 1.6rem → 2.25rem | `text-3xl md:text-4xl` |
| `.text-fluid-section` | 1.35rem → 1.875rem | `text-2xl md:text-3xl` |

Escalan de forma continua con `clamp()`, de modo que no hay saltos al cruzar un
breakpoint. Los extremos coinciden con la escala anterior: **el escritorio no cambia.**

---

## 4. Comportamiento por componente

### 4.1 Tablas — `DataTable`

**Estrategia doble, automática.** No requiere configuración.

| Rango | Presentación |
|---|---|
| `< md` | Una **tarjeta por fila**, generada a partir de las mismas columnas |
| `≥ md` | Tabla con columnas, `min-w-[720px]`, desplazamiento contenido con indicador |

Motivo: una tabla de gestión no cabe en un teléfono, y resolverlo solo con
desplazamiento lateral deja la columna de acciones permanentemente fuera de pantalla —
justo la que permite operar.

#### Prioridad de columna (opcional)

```ts
type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  priority?: "primary" | "secondary" | "actions" | "hidden";  // opcional
  cardLabel?: string;                                          // opcional
};
```

| Prioridad | En la tarjeta |
|---|---|
| `primary` | Encabeza la tarjeta, sin etiqueta |
| `secondary` | Par etiqueta/valor dentro de un `<dl>` |
| `actions` | Pie de la tarjeta, separado por una línea |
| `hidden` | **Se omite** (sigue en la tabla) |

**Si no la declaras se infiere:** primera columna → `primary`; `key === "actions"` →
`actions`; el resto → `secondary`. Por eso las 16 tablas del producto ganaron la vista
móvil sin modificar ni una sola línea en sus pantallas.

Usa `cardLabel` cuando el encabezado sea demasiado escueto fuera del contexto de una
fila de columnas (`"Est."` → `"Estado de la cuenta"`).

### 4.2 Modales — `Modal`

Resuelto dentro de la primitiva:

- anclado arriba cuando no cabe, centrado cuando sí (`items-start` + `my-auto`);
- `max-h-[calc(100dvh-1.5rem)]`, nunca más alto que la ventana;
- **cabecera fija** (título y cerrar siempre visibles) y **cuerpo desplazable**;
- padding progresivo `px-4 sm:px-6`, `p-3 sm:p-4` en el fondo;
- `overscroll-contain` en ambos niveles: sin doble barra de desplazamiento;
- área segura respetada arriba, abajo y a los lados;
- trampa de foco, `Escape`, restauración de foco y bloqueo de scroll **intactos**.

Para las acciones del diálogo, el patrón del sistema es
`flex flex-col-reverse gap-2 sm:flex-row sm:justify-end` (ver `ConfirmDialog`): en
móvil la acción principal queda arriba y a ancho completo.

### 4.3 Encabezados — `PageHeader`

- Columna de texto con `min-w-0` y título con `break-words` y tamaño fluido.
- **Acciones con `flex-wrap`.** `Button` lleva `whitespace-nowrap` a propósito (no
  queremos botones partidos en dos líneas), así que la envoltura ocurre en el
  contenedor.

### 4.4 Navegación

| Shell | `< lg` / `< md` | `≥ lg` / `≥ md` |
|---|---|---|
| `DashboardShell` | Cabecera + **cajón lateral** con superposición, `h-dvh`, `pb-safe` | Barra lateral fija `w-64` |
| `PublicShell` | Cabecera 64 px + **menú desplegable** con scroll propio y `pb-safe` | Nav horizontal |

Todo panel de navegación debe: cerrarse al navegar · cerrarse con `Escape` · bloquear
el scroll de fondo mientras esté abierto · restaurarlo al cerrar · **tener scroll
propio** si su contenido puede superar la altura disponible (crítico en orientación
horizontal).

### 4.5 Botones y acciones

| Tamaño | Alto | Objetivo táctil |
|---|---:|---|
| `sm` | 36 px | 44 px vía `.touch-target` |
| `md` *(por defecto)* | 44 px | ya cumple |
| `lg` | 48 px | ya cumple |
| `icon` | 40 px | 44 px vía `.touch-target` |

Los grupos de acciones deben llevar `flex-wrap`. `CardFooter` ya lo aplica.

### 4.6 Imágenes y multimedia

- Altura **progresiva**, no fija: `h-56 sm:h-72 md:h-[26rem]`.
- Siempre `w-full object-cover` (o `object-contain` en logotipos).
- Reserva el hueco con `min-h-*` en el contenedor para evitar saltos de maquetación.

---

## 5. Antipatrones — no hagas esto

| ❌ | ✅ | Por qué |
|---|---|---|
| `min-w-[760px]` en una tabla | Vista de tarjetas por debajo de `md` | Deja las acciones fuera de pantalla |
| `grid place-items-center` + `overflow-y-auto` | `items-start` + `my-auto` | Recorta el contenido alto por arriba, sin forma de recuperarlo |
| `flex` sin `min-w-0` | `flex min-w-0` | Un hijo flex no encoge por debajo de su contenido |
| `100vh` en un panel | `100dvh` | Las barras del navegador móvil ocultan el pie |
| `window.innerWidth` para maquetar | Media queries CSS | Provoca desajuste de hidratación y re-render por resize |
| Media query nueva por 20 px | Reutiliza `sm`/`md`/`lg` | Fragmenta el sistema |
| Ocultar contenido en móvil sin alternativa | Reorganizar o dar acceso alternativo | Pérdida real de funcionalidad |
| Reducir la tipografía para que quepa | Envolver, truncar o reorganizar | Ilegible |

---

## 6. Decisiones tomadas y su motivo

1. **`md` (768 px) como umbral tabla ↔ tarjetas.** Coincide con la tablet vertical de la
   matriz y con el punto donde `PageHeader` ya pasaba a fila.
2. **Tarjetas en lugar de solo desplazamiento horizontal.** La columna de acciones es la
   que permite operar; con desplazamiento lateral quedaba siempre oculta.
3. **`overflow-x: clip` en `html`, no `hidden`.** `hidden` convierte al elemento raíz en
   contenedor de scroll y rompe `position: sticky` en las cabeceras. Es una **red de
   seguridad, no un sustituto** de arreglar la causa.
4. **Área táctil ampliada solo con `pointer: coarse`.** Preserva la densidad visual con
   ratón y da comodidad con el dedo, sin cambiar el diseño.
5. **Identidad visual intacta.** Ni paleta, ni radios, ni tipografías, ni el tope de
   1200 px. Todos los cambios se acotan con prefijos `sm:`/`md:`, de modo que el
   escritorio conserva sus clases originales.
6. **Sin dependencias nuevas.** Tailwind y CSS moderno bastan.
7. **Sin `<select>` migrado en masa.** La altura de control canónica es **44 px
   (`h-11`)**; conviven `h-10`/`h-14` heredadas. Una migración masiva sería un cambio
   cosmético de amplio alcance sin beneficio responsivo: queda como propuesta.

---

## 7. Lista de comprobación para pantallas nuevas

- [ ] Probada a 320 px sin desplazamiento horizontal.
- [ ] Reutiliza `PageHeader`, `Card`, `TableShell`, `DataTable`, `Modal` — sin anchos propios.
- [ ] Los grupos de botones llevan `flex-wrap`.
- [ ] Los contenedores flex con texto llevan `min-w-0`.
- [ ] Las alturas de imagen son progresivas.
- [ ] Los paneles anclados a un borde usan `dvh` y `pb-safe`.
- [ ] Probada con textos largos y con datos reales, no solo con datos de ejemplo.
- [ ] Probada con zoom al 200 % (equivale a la mitad del ancho de ventana).
- [ ] Estados de carga, vacío y error comprobados también en móvil.
- [ ] `npx playwright test --project=responsive` en verde.

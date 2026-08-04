# Tokens del sistema de diseño

- **Fecha de evidencia:** 2026-08-03
- **Fuente:** [src/app/tokens.css](../../src/app/tokens.css), [tailwind.config.ts](../../tailwind.config.ts)
- **Contrato verificado por:** `tests/unit/design-tokens.test.ts` (12 casos)

## 1. Dos capas, una fuente de verdad

Todo el color del producto sale de `src/app/tokens.css`. Hay dos capas y **el código nuevo solo debe usar la primera**:

| Capa | Ejemplos | Para qué |
|---|---|---|
| **Roles semánticos** | `bg-card`, `text-ink-muted`, `border-line`, `bg-success-surface` | Lo que debe usar el código nuevo. Dice *qué papel* cumple el color. |
| **Escalas numéricas** | `text-teal-800`, `bg-slate-50`, `text-red-600` | Compatibilidad con ~490 usos previos. Redirigidas a variables CSS. |

Los valores se declaran como **HSL sin envolver** (`38 44% 97%`, no `hsl(…)`) para poder componerlos con opacidad: `bg-primary/10`, `text-ink/60`. Escribirlos envueltos o en hexadecimal rompe en silencio todas las clases con opacidad de ese token — el color se aplica y la transparencia no. Hay una prueba que lo impide.

## 2. Roles disponibles

### Superficies e ink (escala de elevación)

| Token | Clase | Papel |
|---|---|---|
| `--background` | `bg-background` | Fondo de página |
| `--surface-raised` | `bg-surface-raised` | Panel por encima del fondo |
| `--surface-sunken` | `bg-surface-sunken` | Zona hundida, cabeceras de tabla |
| `--surface-accent` | `bg-surface-accent` | Realce rosado de marca |
| `--surface-inverse` | `bg-surface-inverse` | Secciones oscuras de la landing |
| `--surface-inverse-deep` | `bg-surface-inverse-deep` | Extremo del degradado editorial |
| `--surface-inverse-foreground` | `text-surface-inverse-foreground` | Texto **sobre** las dos anteriores |
| `--foreground` | `text-ink` | Tinta principal |
| `--ink-soft` | `text-ink-soft` | Tinta secundaria fuerte |
| `--ink-muted` | `text-ink-muted` | Texto secundario |
| `--ink-subtle` | `text-ink-subtle` | Texto terciario, metadatos |
| `--line` | `border-line` | Borde estándar |
| `--line-strong` | `border-line-strong` | Borde marcado |

> `surface-inverse-foreground` es claro en **ambos** temas, a diferencia de `foreground`. Es lo que hay que usar sobre un bloque oscuro o un botón de color; usar `text-ink` ahí produce texto oscuro sobre fondo oscuro en el tema claro.

### Estados

Cada estado tiene un trío: `DEFAULT` (color fuerte, para texto e iconos), `surface` (fondo del aviso) y `border`.

| Estado | Aviso suave | Relleno sólido |
|---|---|---|
| Éxito | `bg-success-surface border-success-border text-success` | `bg-success text-success-foreground` |
| Aviso | `bg-warning-surface border-warning-border text-warning` | `bg-warning text-warning-foreground` |
| Error | `bg-destructive-surface border-destructive-border text-destructive` | `bg-destructive text-destructive-foreground` |
| Información | `bg-info-surface border-info-border text-info` | `bg-info text-info-foreground` |

Antes de esto, «éxito» era `emerald-100/800` en `Badge`, `emerald-50/300/800` en `toast` y nada en otros sitios: cambiar el color obligaba a tocar varios archivos y ninguno respondía al tema oscuro.

### Marca

`brand-terracotta`, `brand-clay`, `brand-plum`, `brand-gold`, `brand-sand`. Son los acentos editoriales de la landing.

### Forma, elevación y movimiento

`--radius`; sombras `shadow-elev-sm|md|lg|overlay` (`shadow-soft` se conserva como alias de `lg`); duraciones `duration-fast|base|slow`; curva `ease-out-soft`; apilamiento `z-sticky|header|overlay|toast|skip-link`.

La escala de apilamiento existía de facto (`z-40` en la cabecera, `z-50` en modales, `z-[200]` en los toasts, `999` en el enlace de salto) pero sin nombre, así que cada componente nuevo elegía un número al azar.

## 3. Las cinco paletas remapeadas

`teal`, `slate`, `emerald`, `amber` y `red` **no son las de Tailwind**. Apuntan a variables CSS:

| Paleta de Tailwind | Escala real | Qué es de verdad |
|---|---|---|
| `teal-*` | `--brand-*` | Rojo/marrón del logo (ADR-0006) |
| `slate-*` | `--neutral-*` | Gris **cálido**, no azulado |
| `emerald-*` | `--positive-*` | Verde de éxito |
| `amber-*` | `--caution-*` | Ámbar de aviso |
| `red-*` | `--negative-*` | Rojo de error |

> **`text-teal-800` no pinta verde azulado, sino marrón rojizo.** Es la trampa más importante de este sistema para quien llega nuevo.

**No uses estas paletas en código nuevo.** Existen para que ~490 usos previos respondieran al tema oscuro sin reescribir cada componente, no como interfaz. Ver [ADR-0011](../adr/ADR-0011-tokens-y-paletas-remapeadas.md).

## 4. Tema oscuro

Se activa con la clase `dark` en `<html>`. En el bloque `.dark` las escalas numéricas se **invierten**: `bg-*-50` sigue significando «fondo sutil» y `text-*-800` sigue significando «tinta de alto contraste» — lo que cambia es el valor necesario para cumplirlo sobre fondo oscuro.

No es una inversión mecánica: se conservan los matices cálidos de la marca (12–38°) para que el producto no se vuelva azul-grisáceo genérico.

Ver [themes.md](./themes.md) para el mecanismo completo.

## 5. Cómo añadir un token

1. Declararlo en `:root` **y** en `.dark` de `src/app/tokens.css`, como HSL sin envolver.
2. Si debe ser una clase de Tailwind, exponerlo en `tailwind.config.ts`.
3. `yarn test:unit` — el contrato de `design-tokens.test.ts` comprueba la paridad entre temas, el formato del valor y que no queden hexadecimales fuera de los comentarios.

Los tokens que **no** dependen del tema (radio, duraciones, curva, apilamiento) se declaran solo en `:root`; la prueba comprueba además que no se dupliquen en `.dark`.

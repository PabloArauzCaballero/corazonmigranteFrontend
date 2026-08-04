# Color

- **Fecha de evidencia:** 2026-08-03
- **Evidencia:** [globals.css](../../src/app/globals.css), [tailwind.config.ts](../../tailwind.config.ts)

## 1. Tokens semánticos

Declarados como **HSL sin envolver** en `:root`, lo que permite componerlos con opacidad (`bg-primary/10`):

| Token | HSL | Aproximación | Uso |
|---|---|---|---|
| `--background` | `38 44% 97%` | Crema muy claro | Fondo de página |
| `--foreground` | `12 20% 13%` | Casi negro cálido | Texto principal |
| `--card` | `0 0% 100%` | Blanco | Fondo de tarjeta |
| `--primary` | `0 82% 28%` | Rojo profundo | Acción principal, marca |
| `--primary-foreground` | `0 0% 100%` | Blanco | Texto sobre primario |
| `--secondary` | `34 42% 91%` | Beige claro | Acción secundaria |
| `--muted` | `36 28% 92%` | Beige neutro | Fondos atenuados |
| `--muted-foreground` | `31 7% 39%` | Gris cálido | Texto secundario |
| `--accent` | `342 31% 92%` | Rosa claro | Realce |
| `--destructive` | `0 62% 44%` | Rojo | Acciones destructivas |
| `--border` / `--input` | `34 20% 84%` | Beige | Bordes |
| `--ring` | `0 82% 28%` | Igual que primario | Anillo de foco |

Que `--ring` coincida con `--primary` hace que el foco de teclado use el color de marca — coherente y suficientemente contrastado.

## 2. ⚠️ La paleta `teal` está remapeada

```ts
teal: {
  50: "#faf1ef",  100: "#f5e0db", 200: "#eac2b8", 300: "#dd9988",
  400: "#cf7159", 500: "#b64f35", 600: "#96412c", 700: "#7e3725",
  800: "#673022", 900: "#54271c", 950: "#361912"
}
```

`tailwind.config.ts` **sustituye la paleta `teal` de Tailwind** por los rojos y marrones de la marca. El comentario del código lo justifica: el sitio usaba `teal-800/900/950` en muchos componentes y remapear evitaba tocarlos uno a uno.

> **`text-teal-800` no pinta verde azulado, sino marrón rojizo (`#673022`).**

Es la trampa más importante de este sistema de diseño para quien llegue nuevo. Documentada también en [ADR-0006](../adr/ADR-0006-tailwind-radix.md).

## 3. Colores fuera del sistema

Algunos componentes usan paletas de Tailwind directamente en vez de tokens:

| Componente | Colores |
|---|---|
| `Badge variant="success"` | `emerald-100` / `emerald-800` |
| `Badge variant="warning"` | `amber-100` / `amber-800` |
| `Badge variant="danger"` | `red-100` / `red-800` |
| `ForbiddenState` | `amber-50` / `amber-200` / `amber-700` / `amber-900/80` |
| `toast` success/warning/danger | `emerald`, `amber`, `red` |

Es una inconsistencia real: los estados semánticos (éxito, aviso, error) **no tienen token propio**. Funciona, pero cambiar el color de «éxito» exige tocar varios archivos.

Registrado como observación. Introducir tokens `--success` / `--warning` sería `CAMBIO DE PRODUCTO`.

## 4. Fondo compuesto

`body` usa tres capas superpuestas: dos gradientes radiales cálidos y uno lineal. Es lo que da la textura del sitio y no está tokenizado — vive directamente en `globals.css`.

## 5. Contraste

**No verificado.** Ver [../accessibility/color-and-contrast.md](../accessibility/color-and-contrast.md) para el inventario de las diez combinaciones que requieren comprobación, encabezado por `--muted-foreground` sobre `--card`.

## 6. Reglas

1. Usar tokens semánticos (`bg-primary`, `text-muted-foreground`), no valores literales.
2. No usar `teal-*` esperando verde azulado.
3. Todo color nuevo de estado debería ser un token, no una paleta de Tailwind directa.
4. El color nunca es el único portador de información (WCAG 1.4.1).

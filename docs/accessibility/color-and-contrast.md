# Color y contraste

- **Fecha de evidencia:** 2026-08-03

> ⚠️ **Este documento no afirma cumplimiento de contraste.** El repositorio no tiene herramienta de medición y los valores no se han verificado sobre la interfaz renderizada. Lo que sigue es el inventario de combinaciones y las que requieren comprobación prioritaria. Brecha `A11Y-02`.

---

## 1. Tokens de color

Definidos como HSL sin envoltura en [globals.css](../../src/app/globals.css), para poder componerlos con opacidad en Tailwind:

| Token | Valor HSL | Uso |
|---|---|---|
| `--background` | `38 44% 97%` | Fondo de página (crema muy claro) |
| `--foreground` | `12 20% 13%` | Texto principal (casi negro cálido) |
| `--card` | `0 0% 100%` | Fondo de tarjeta (blanco puro) |
| `--card-foreground` | `12 20% 13%` | Texto sobre tarjeta |
| `--primary` | `0 82% 28%` | Rojo de marca |
| `--primary-foreground` | `0 0% 100%` | Texto sobre primario |
| `--secondary` | `34 42% 91%` | Beige claro |
| `--secondary-foreground` | `12 20% 16%` | Texto sobre secundario |
| `--muted` | `36 28% 92%` | Fondo atenuado |
| `--muted-foreground` | `31 7% 39%` | **Texto atenuado — el más dudoso** |
| `--accent` | `342 31% 92%` | Rosa claro |
| `--accent-foreground` | `342 36% 25%` | Texto sobre acento |
| `--destructive` | `0 62% 44%` | Rojo de acción destructiva |
| `--destructive-foreground` | `0 0% 100%` | Texto sobre destructivo |
| `--border` / `--input` | `34 20% 84%` | Bordes |
| `--ring` | `0 82% 28%` | Anillo de foco (igual que primario) |

## 2. Paleta `teal` remapeada

[tailwind.config.ts](../../tailwind.config.ts) **sustituye la paleta `teal` de Tailwind** por los rojos y marrones de la marca:

```ts
teal: { 50: "#faf1ef", …, 500: "#b64f35", …, 950: "#361912" }
```

El comentario explica la decisión: *«el sitio usa clases `teal-800/900/950` en muchos componentes, y remapear la paleta aquí evita tener que tocar cada uno»*.

**Consecuencia para quien mantenga el código:** una clase `text-teal-800` **no pinta verde azulado, sino marrón rojizo** (`#673022`). Es una trampa esperando a quien llegue nuevo al proyecto y confíe en el nombre. Se documenta aquí precisamente por eso. Está registrado en [../design-system/colors.md](../design-system/colors.md).

## 3. Combinaciones que requieren verificación prioritaria

| # | Primer plano | Fondo | Uso | Riesgo estimado |
|---|---|---|---|---|
| 1 | `--muted-foreground` `31 7% 39%` | `--card` `0 0% 100%` | Descripciones de `PageHeader`, `EmptyState`, `ErrorState` | 🟡 **El más probable de fallar** — gris de baja saturación sobre blanco |
| 2 | `--muted-foreground` | `--muted` `36 28% 92%` | Texto atenuado sobre fondo atenuado | 🟡 Alto |
| 3 | `amber-800` | `amber-100` | `Badge variant="warning"` | 🟡 Verificar |
| 4 | `emerald-800` | `emerald-100` | `Badge variant="success"` | 🟢 Probablemente correcto |
| 5 | `red-800` | `red-100` | `Badge variant="danger"` | 🟢 Probablemente correcto |
| 6 | `amber-900/80` | `amber-50` | `ForbiddenState` | 🟡 La opacidad al 80 % reduce el contraste efectivo |
| 7 | `--primary-foreground` blanco | `--primary` `0 82% 28%` | Botón por defecto | 🟢 Rojo oscuro con blanco: alto contraste |
| 8 | `--foreground` `12 20% 13%` | `--background` `38 44% 97%` | Texto de página | 🟢 Muy alto |
| 9 | `text-primary` | `bg-primary/10` | Toast `info` | 🟡 Verificar |
| 10 | `--border` `34 20% 84%` | `--card` blanco | Bordes de tarjeta y tabla | 🟡 Componente no textual: exige 3:1 (WCAG 1.4.11) |

La combinación 1 es la más extendida de la aplicación: aparece en toda descripción de `PageHeader` y en los estados vacíos y de error. Si falla, el impacto es amplio.

La combinación 6 ilustra un patrón de riesgo general: **las opacidades reducen el contraste efectivo** y no se ven en una inspección superficial del token.

## 4. Información transmitida solo por color

WCAG 1.4.1 exige que el color no sea el único medio para transmitir información.

| Elemento | ¿Solo color? | Valoración |
|---|---|---|
| `Badge` de estado | ❌ No — lleva texto | ✅ Correcto |
| Variantes de `toast` | ❌ No — icono distinto + texto + `role` | ✅ Correcto |
| `ErrorState` | ❌ No — icono + título + descripción | ✅ Correcto |
| Botón `destructive` | ❌ No — el texto describe la acción | ✅ Correcto |
| Campo de formulario con error | ⚠️ **No verificado** | Si el borde rojo es la única señal, incumpliría |

El último punto se solapa con `A11Y-05` y es el único riesgo real de 1.4.1 detectado.

## 5. Modo oscuro

`darkMode: ["class"]` está configurado en Tailwind, pero:

- **ninguna clase `dark` se aplica** en el código;
- el `viewport` fija `colorScheme: "light"`;
- `themeColor` sí declara un color para `prefers-color-scheme: dark` (`#27120c`), lo que solo afecta a la barra del navegador.

Está registrado en `pending-items.md` como `PENDIENTE_CM_MODO_OSCURO`. **No es un incumplimiento de accesibilidad** —WCAG no exige modo oscuro—, pero sí trabajo a medio hacer que podría confundir. Ver [../design-system/themes.md](../design-system/themes.md).

## 6. Cómo verificar

Sin herramienta en el repositorio, la verificación es manual:

1. Extensión axe DevTools o Lighthouse en el navegador, sobre la aplicación en ejecución.
2. Comprobar las diez combinaciones del §3, empezando por la 1.
3. Umbrales WCAG AA: **4,5:1** para texto normal, **3:1** para texto grande (≥24 px o ≥19 px en negrita) y para componentes de interfaz (1.4.11).

**Propuesta de instrumentación** (`INSTRUMENTACIÓN SEGURA`, no implementada): `jest-axe` sobre los componentes de `shared/ui` detectaría automáticamente los fallos de contraste de las combinaciones 1 a 9, ya que todas se materializan en componentes compartidos.

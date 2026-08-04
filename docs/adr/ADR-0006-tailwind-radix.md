# ADR-0006: Tailwind + Radix como sistema de diseño

## Estado

**Aceptado** — estado observado el 2026-08-03.

## Decisión

- **Tailwind CSS 3.4** con tokens en variables CSS (HSL sin envolver).
- **Radix UI** para primitivas accesibles: `dialog`, `label`, `slot`, `tabs`.
- **`class-variance-authority`** para variantes tipadas.
- **`clsx` + `tailwind-merge`** combinados en `cn()`.
- **`lucide-react`** para iconos.
- 19 componentes propios en `src/shared/ui/`.

Sin librería de componentes completa (MUI, Chakra, Ant Design).

## Opciones consideradas

| Opción | Descartada porque |
|---|---|
| **Tailwind + Radix + componentes propios** (elegida) | — |
| Librería completa | Peso, opinión visual fuerte, difícil de ajustar a la identidad de marca |
| CSS Modules | Sin sistema de tokens ni utilidades; más código por componente |
| CSS-in-JS | Coste en tiempo de ejecución; fricción con Server Components |

## Consecuencias positivas

- **Los tokens se declaran una vez** en `globals.css` como HSL sin envolver, lo que permite componerlos con opacidad (`bg-primary/10`).
- Radix aporta accesibilidad probada donde más cuesta: `Label` asocia correctamente etiqueta y control; `Slot` habilita el patrón `asChild` de `Button`.
- `cva` da variantes tipadas: `variant` y `size` de `Button` son tipos, no cadenas.
- `tailwind-merge` resuelve los conflictos de clases al componer.
- Peso reducido: Tailwind purga por contenido y no se arrastra una librería completa.

## Consecuencias negativas

### La paleta `teal` está remapeada — y es una trampa

```ts
teal: { 50: "#faf1ef", …, 500: "#b64f35", …, 950: "#361912" }
```

`tailwind.config.ts` **sustituye la paleta `teal` de Tailwind** por los rojos y marrones de la marca. El comentario lo justifica: *«el sitio usa clases `teal-800/900/950` en muchos componentes, y remapear la paleta aquí evita tener que tocar cada uno»*.

**Consecuencia: `text-teal-800` no pinta verde azulado, sino marrón rojizo (`#673022`).** Es una decisión pragmática que evitó una refactorización amplia, y a la vez una trampa para quien llegue nuevo y confíe en el nombre del token.

### Otras

- Al no haber Storybook, el catálogo de componentes es **documental**: hay que leer el código para conocer las variantes.
- **Dos sistemas de iconos** conviven: `lucide-react` (predominante) y `fontawesome.tsx` (`PERF-05`).
- El modo oscuro está configurado (`darkMode: ["class"]`) pero **inactivo**: ninguna clase `dark` se aplica y `colorScheme` es `"light"` fijo.
- 18 de los 19 componentes propios **no tienen prueba** (`TEST-02`).

## Riesgos

| Riesgo | Severidad |
|---|---|
| Alguien usa `teal-*` esperando verde azulado | LOW — visible de inmediato |
| Contraste sin verificar en 10 combinaciones (`A11Y-02`) | MEDIUM |
| Regresión en la lógica de accesibilidad de `Modal` sin prueba que la detecte (`TEST-02`) | **HIGH** |
| Divergencia visual por falta de catálogo ejecutable | LOW |

## Evidencia

- [tailwind.config.ts](../../tailwind.config.ts) — remapeo de `teal` con su comentario
- [globals.css](../../src/app/globals.css) — tokens HSL, `.focus-ring`, `skip-link`, tres bloques `prefers-reduced-motion`
- [components/catalog.md](../components/catalog.md)
- `package.json` — 4 paquetes de Radix, `cva`, `clsx`, `tailwind-merge`

## Plan de revisión

Revisar si: se decide activar el modo oscuro, se incorpora Storybook, o el remapeo de `teal` causa confusión reiterada — en cuyo caso convendría renombrar la paleta a `brand` y migrar las clases.

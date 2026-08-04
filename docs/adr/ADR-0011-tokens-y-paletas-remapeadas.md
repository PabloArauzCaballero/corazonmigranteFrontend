# ADR-0011: Paletas de Tailwind redirigidas a variables CSS

- **Fecha:** 2026-08-03
- **Estado:** Aceptada
- **Sustituye parcialmente a:** [ADR-0006](./ADR-0006-tailwind-radix.md) (que introdujo el remapeo de `teal`)

## Contexto

Para implementar el tema oscuro había que hacer que el color respondiera al tema. El inventario del código encontró:

| Origen del color | Usos |
|---|---|
| Literales hexadecimales (`bg-[#fbfaf8]`, `text-[#2b1b17]`…) | 280 |
| `bg-white` / `text-white` / `border-white` | 250 |
| Paleta `slate` | 252 |
| Paleta `teal` (ya remapeada a la marca) | 98 |
| Paletas `red` / `emerald` / `amber` | 142 |

Ninguno respondía al tema. Los literales y los `white` sí podían migrarse a tokens con una sustitución mecánica verificable. Las **paletas numéricas** eran otro problema: ~490 usos repartidos por 40 archivos, cada uno con su matiz de significado (`slate-500` como texto secundario, `slate-200` como borde, `slate-50` como fondo).

## Alternativas consideradas

1. **Reescribir los ~490 usos a roles semánticos.** Es lo correcto en abstracto, pero exige decidir a mano el papel de cada uno de los 490 y no hay forma de verificar el resultado salvo revisando 40 pantallas a ojo. Riesgo alto de regresión visual a cambio de ningún beneficio funcional.
2. **Añadir variantes `dark:` a cada uso.** Duplica 490 clases y deja dos sitios que mantener sincronizados por cada color. Es exactamente la duplicación que el plan prohíbe.
3. **Redirigir las cinco paletas a variables CSS.** Los valores del tema claro se conservan **idénticos**, así que el aspecto actual no cambia; el bloque `.dark` redefine la escala invertida.

## Decisión

Se adopta la alternativa 3. `teal`, `slate`, `emerald`, `amber` y `red` apuntan a las escalas `--brand-*`, `--neutral-*`, `--positive-*`, `--caution-*` y `--negative-*`.

Además:

- Los 280 literales hexadecimales y los 250 `white`/`black` **sí** se migraron a roles semánticos (`surface-*`, `ink-*`, `line*`, `brand-*`). Ahí la sustitución era mecánica y verificable.
- La escala `neutral` se templa hacia el matiz cálido de la marca (28–38°) en lugar del gris azulado de Tailwind. Las **luminosidades** se mantienen equivalentes a las de `slate`, de modo que las relaciones de contraste no bajan. Los grises fríos junto al crema de fondo eran la inconsistencia cromática que señalaba la auditoría visual.

## Consecuencias

**A favor**

- ~490 usos existentes responden al tema oscuro sin tocar ni un componente.
- El tema claro es indistinguible del anterior: la migración no arrastra regresiones visuales.
- Existe un único sitio donde cambiar cualquier color del producto.

**En contra**

- **Los nombres mienten.** `text-teal-800` es marrón, `bg-slate-50` es crema cálido, y `red-600` en oscuro es más claro que `red-300`. Es la deuda que se acepta a cambio de no reescribir 490 usos.
- Mitigación: queda documentado en [tokens.md](../design-system/tokens.md), en el comentario de `tailwind.config.ts` y en esta ADR, y el código nuevo tiene roles semánticos que cubren todos los casos.

**Cómo se sale de aquí**

La migración de las paletas numéricas a roles semánticos puede hacerse por archivos, sin prisa: cada uso que se convierte a `text-ink-muted` o `bg-success-surface` deja de depender del remapeo. Cuando no queden usos de `teal`/`slate`/`emerald`/`amber`/`red`, las cinco entradas de `tailwind.config.ts` se borran y esta ADR queda superada.

## Verificación

`tests/unit/design-tokens.test.ts` comprueba que cada token del tema claro tenga contrapartida en oscuro, que las cinco escalas estén completas en ambos temas, que los valores sean HSL sin envolver (o las clases con opacidad fallarían en silencio) y que no queden hexadecimales fuera de los comentarios.

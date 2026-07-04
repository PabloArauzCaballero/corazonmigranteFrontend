# Auditoría de corrección Landing v5 — schema real `landing_v2`

## Motivo de la corrección

La versión anterior normalizaba la respuesta pública como si todas las secciones fueran tarjetas simples. Eso hacía que se perdiera contenido real enviado por backend, especialmente:

- `hero.visual.bubbles`, `hero.visual.stats`, `hero.trust_cards`.
- `sections.map.paragraphs.main`.
- `sections.map.paragraphs.aditional`.
- `sections.map.paragraphs.testimonios`.
- `sections.map.paragraphs.conclusion_phrase`.
- `sections.mission.feature_cards`.
- `sections.emotions.items` con imagen por `id_ui`.
- `sections.psicologists.items` con historia completa.
- `sections.cta`.
- `footer.tagline`, `footer.quick_links`, `footer.notice` y `footer.legal`.

## Corrección aplicada

Se agregó un renderizador específico para el contrato real:

- `src/features/public-view/landing-v2.types.ts`
- `src/features/public-view/landing-v2.mapper.ts`
- `src/features/public-view/landing-v2-page.tsx`

`PublicLandingPage` ahora detecta `meta.schema === "landing_v2"` o una estructura compatible con `navbar + hero + sections + footer`, y renderiza la landing completa sin recortar el contenido.

## Decisiones de UX

- No se oculta el contenido largo: se renderizan todos los párrafos principales, adicionales, testimonios, conclusiones, especialistas y footer.
- El hero usa el chat visual configurado desde backend, no una imagen genérica.
- La navegación respeta los links del backend y añade Biblioteca como acceso público.
- Se mantienen fuera del menú público rutas internas como booking/admin/paciente/terapeuta.
- El botón público de disponibilidad/contacto no abre booking público; prioriza contacto o ancla `#contacto` según la acción configurada.
- `intense_nostalgia` se muestra como `Nostalgia intensa` para evitar exponer una clave técnica al usuario final.

## Validación ejecutada en sandbox

- `tsc --noEmit`: OK.
- `eslint . --max-warnings=0`: OK.

No se ejecutó `next build` ni `tsx` porque el `node_modules` disponible provenía de Windows y fallan binarios nativos de SWC/esbuild en Linux. En una instalación limpia del proyecto debe ejecutarse:

```bash
yarn install
yarn typecheck
yarn lint
yarn test:unit
yarn build
```

# Auditoría landing v6 contra versión antigua defectuosa

## Veredicto

La versión v5 ya dejó de recortar el contrato `landing_v2`, pero al contrastarla con la versión antigua se detectaron mejoras necesarias para que el entregable no parezca una pérdida funcional frente a la landing anterior.

## Lo que la versión antigua hacía mejor

- Tenía barra de progreso de scroll.
- Tenía navegación móvil con acciones visibles.
- Soportaba `presentation_section` como bloque visual opcional.
- Tenía CTA/fab de contacto siempre accesible.
- Respetaba más explícitamente la estructura narrativa larga de `map`, testimonios, especialistas y CTA.

## Lo que se conserva/mejora en v6

- Se mantiene el render específico para `meta.schema = landing_v2`.
- No se recortan `hero.visual.bubbles`, `trust_cards`, párrafos principales, párrafos adicionales, testimonios, conclusiones, misión, emociones, especialistas, CTA ni footer.
- Se añadió soporte defensivo para `presentation_section`, por compatibilidad con la versión antigua.
- Se añadió soporte defensivo para imagen/link de historia cuando llegan fuera de `sections.map`.
- Se añadió barra de progreso de scroll.
- Se corrigió la navegación móvil para mostrar Acceder, Registrarse y Contactar.
- Se mantiene Biblioteca y se filtran rutas internas como booking, proceso, paciente, terapeuta y admin en navegación pública.

## Decisión sobre 3D

No se recomienda navegación 3D fuerte. Para Corazón Migrante conviene una experiencia sobria: profundidad sutil, hover limpio, sombras suaves y transición fluida. Efectos 3D agresivos pueden hacer que la marca se vea menos profesional.

## Validación posible en sandbox

No se ejecutó `next build` dentro del sandbox porque no hay `node_modules` Linux instalados. El proyecto debe validarse localmente con instalación limpia:

```bash
yarn install
yarn typecheck
yarn lint
yarn test:unit
yarn build
```

# Auditoría Landing v7 — render inicial y schema real

## Problema corregido

La home pública estaba definida como componente cliente (`"use client"`) y cargaba la landing con `useEffect`. Por eso el HTML inicial quedaba congelado en una pantalla de carga:

- `Cargando página principal`
- sin navbar real;
- sin hero;
- sin secciones del `landing_v2`;
- sin testimonios, especialistas ni footer.

Además `next.config.ts` usaba `output: "export"`, lo que fuerza exportación estática. Esa configuración no sirve para una landing que debe renderizar el contenido público desde backend/Vistas Públicas en el primer HTML.

## Cambios aplicados

1. `src/app/page.tsx` ahora es Server Component.
2. Se eliminó el flujo client-only de `useEffect/useState` en la home.
3. Se agregó `dynamic = "force-dynamic"` y `revalidate = 0` para que la landing consulte backend en runtime.
4. `next.config.ts` dejó de usar exportación estática.
5. Se mantuvo el renderer específico de `meta.schema = landing_v2`.
6. Se reforzó el normalizador para aceptar `content` como objeto o JSON serializado.
7. Se corrigió el logo de navbar cuando `navbar.brand.icon` llega como `id_ui` numérico.
8. El menú público sigue filtrando rutas internas: proceso, agendar, booking/citas, paciente, terapeuta y admin.
9. Se mantiene Biblioteca como acceso público.

## Resultado esperado

Al abrir la home, el HTML inicial ya debe contener contenido real de la landing, por ejemplo:

- `¿Lejos de tu hogar?`
- `El mapa de un corazón migrante`
- `Nuestros especialistas`
- nombres de especialistas;
- historias/testimonios;
- footer legal.

Ya no debe quedarse en `Cargando página principal`.

## Nota de despliegue

Este entregable está preparado para ejecutarse como aplicación Next.js con Node (`next build` + `next start`). No debe desplegarse como exportación estática si se espera renderizar Vistas Públicas desde backend en el primer HTML.

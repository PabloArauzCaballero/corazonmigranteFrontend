# Línea base del bundle (antes de OpenTelemetry)

Generado con `yarn next build --no-lint` el 2026-08-03, sobre `main` con el árbol
de trabajo actual. Se usa `--no-lint` porque `yarn build` ya fallaba antes de este
trabajo por un error de ESLint preexistente en `src/features/tutorial/ui/tutorial-tour.tsx:29`
(`react-hooks/set-state-in-effect`), ajeno a la observabilidad.

## Cifra de control

| Métrica | Valor base |
| --- | --- |
| **First Load JS compartido por todas las rutas** | **100 kB** |
| `chunks/4bd1b696-*.js` | 54.1 kB |
| `chunks/5964-*.js` | 44 kB |
| otros chunks compartidos | 2.01 kB |
| Landing `/` (la más pesada) | 28.2 kB propios · **186 kB** First Load |
| `/admin/usuarios` | 17.1 kB propios · 162 kB First Load |
| `/login` | 144 B propios · 160 kB First Load |
| Rutas totales | 55 páginas + `robots.txt`, `sitemap.xml`, `manifest.webmanifest`, `icon.svg` |
| Rutas dinámicas | `/[slug]` (SSG con `generateStaticParams`) |
| Route handlers | `/api/debug-log` (marcado `ƒ`; **no se exporta** en `output: "export"`) |

## Criterio de aceptación

El SDK web de OpenTelemetry se carga con `import()` dinámico y **solo** cuando
`NEXT_PUBLIC_OTEL_ENABLED=true`. Por tanto:

1. Con la telemetría **apagada** (valor por defecto), el *First Load JS
   compartido* debe seguir en **100 kB** ±1 kB. El único coste permanente es el
   módulo de arranque (unos pocos cientos de bytes) y `@opentelemetry/api`, que
   es la dependencia más ligera del ecosistema.
2. Con la telemetría **encendida**, el SDK viaja en un chunk aparte que se
   descarga después de la hidratación y **no** entra en el First Load de ninguna
   ruta.

La comprobación posterior está en `docs/observability/frontend/bundle-after.md`.

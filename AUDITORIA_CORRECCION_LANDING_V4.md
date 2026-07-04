# Corrección real de Landing — v4

## Problema atendido
La versión anterior no interpretaba bien la estructura real enviada por Vistas Públicas ni los assets alojados en `https://storage.googleapis.com/vistas_publicas_assets`. Además, todavía quedaban rutas públicas con textos como Proceso/Agendar en el shell público.

## Cambios aplicados

- Rediseño real de `PublicLandingPage`, no solo cambio de textos.
- Normalizador robusto para estructuras:
  - `publicView.content`
  - CMS con `elements`
  - legacy `pagina_1`, `pagina_2`, `pagina_3`, `pagina_4`
  - imágenes como string, objeto, `id_ui`, rutas relativas o URL absoluta.
- Resolución segura de assets del bucket:
  - no renderiza el root del bucket como imagen;
  - convierte rutas relativas tipo `landing_page/media/archivo.png` a URL pública;
  - conserva URLs absolutas válidas de Google Storage.
- Menú público corregido:
  - fuera `Proceso`;
  - fuera `Agendar`;
  - se mantiene `Biblioteca`;
  - botones `Ingresar`, `Crear cuenta` y `Contactar`.
- Nuevo helper reutilizable de contacto:
  - `src/features/landing/contact.ts`
  - soporta `landing.phone` y `NEXT_PUBLIC_PUBLIC_CONTACT_PHONE`.
- `PublicShell` también corregido para que las páginas públicas no muestren Proceso/Agendar.
- Test unitario actualizado para cubrir estructura legacy `pagina_1..pagina_4` con assets de Google Storage.

## Validación ejecutada en sandbox

- `tsc --noEmit`: OK.
- `eslint . --max-warnings=0`: OK.
- Smoke manual de rutas App Router duplicadas: OK.
- Smoke manual de menú público: OK.

## Limitación del sandbox

No se pudo ejecutar Jest/tsx completo porque el `node_modules` original del zip fue instalado en Windows y el sandbox corre Linux; esbuild/SWC requiere binarios nativos por plataforma. En una instalación limpia debe correr con:

```bash
yarn install
yarn typecheck
yarn lint
yarn test:unit
yarn test:smoke
yarn build
```

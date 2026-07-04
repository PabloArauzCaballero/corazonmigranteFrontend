# Auditoría y corrección frontend Corazón Migrante

## Resultado

Se revisó el frontend completo entregado por ZIP y se aplicaron correcciones para reducir al mínimo los fallos de landing pública, biblioteca y endpoints CMS públicos.

## Correcciones aplicadas

1. Se eliminó la ruta duplicada `src/app/(public)/page.tsx`.
   - En Next.js, un route group `(public)` no cambia la URL final.
   - Ese archivo competía con `src/app/page.tsx`, ambos resolvían `/`.
   - Se dejó como única home real `src/app/page.tsx`, que carga la landing configurable desde backend.

2. Se corrigió ESLint.
   - Antes intentaba analizar `out/` y podía fallar con archivos generados por Next.
   - Ahora ignora `.next/`, `.swc/`, `out/`, `dist/`, `node_modules/`, coverage y reportes.

3. Se robusteció `public-view.api.ts`.
   - La landing ya no depende de un único endpoint.
   - Si falla `/api/v1/public-views/1`, intenta fallback controlado por CMS:
     - `/api/v1/public/pages/inicio`
     - `/api/v1/public-views/1`
   - No inventa contenido local; solo intenta endpoints públicos reales.

4. Se robusteció biblioteca.
   - `getPublicCmsPage('biblioteca')` intenta:
     - `/api/v1/public/pages/biblioteca`
     - `/api/v1/public-views/2`
   - Esto protege compatibilidad legacy si el backend todavía sirve biblioteca como vista pública numérica.

5. Se mejoró el parseo de errores de backend.
   - Ahora `apiRequest` reconoce la forma real:
     - `{ error: { message } }`
   - Así el frontend no muestra mensajes genéricos cuando el backend devuelve errores estructurados.

6. Se añadió script de verificación real de endpoints públicos:
   - `yarn check:public-endpoints`
   - Valida que producción responda JSON y HTTP 200 para:
     - `/api/v1/public-views/1`
     - `/api/v1/public/pages/inicio`
     - `/api/v1/public/pages/inicio/elements/hero`
     - `/api/v1/public/pages/biblioteca`
     - `/api/v1/public/pages/biblioteca/elements/hero`
     - `/api/v1/public-views/2`

7. Se hicieron más estrictas las pruebas de contrato backend para endpoints públicos.
   - Ya no aceptan 404 para landing/biblioteca si estás probando contra producción real.

## Validaciones ejecutadas en sandbox

Comandos equivalentes ejecutados directamente con Node porque `yarn` no está instalado en el sandbox:

```bash
node node_modules/typescript/bin/tsc --noEmit
node node_modules/eslint/bin/eslint.js . --max-warnings=0
```

Resultado:

```txt
typecheck: OK
lint: OK
```

## Validaciones no ejecutadas completamente en sandbox

No pude ejecutar `next build`, `jest` ni `tsx` completos porque el ZIP trae `node_modules` instalado desde Windows y el sandbox es Linux. Eso provoca errores de binarios nativos de `@next/swc` y `esbuild` para otra plataforma.

En tu máquina Windows y en Coolify, después de `yarn install`, estos comandos sí deben ejecutarse:

```powershell
yarn typecheck
yarn lint
yarn build
yarn test:unit
yarn test:smoke
yarn check:public-endpoints
```

## Variables recomendadas para Coolify frontend

```env
NEXT_PUBLIC_APP_NAME=Corazón Migrante
NEXT_PUBLIC_APP_URL=https://corazondemigrante.com
NEXT_PUBLIC_API_BASE_URL=https://api.corazondemigrante.com

NEXT_PUBLIC_CMS_LIBRARY_SLUG=biblioteca

NEXT_PUBLIC_PUBLIC_VIEW_MODE=public-view-id
NEXT_PUBLIC_PUBLIC_VIEW_SLUG=1
NEXT_PUBLIC_PUBLIC_VIEW_ID=
NEXT_PUBLIC_PUBLIC_VIEW_CODE=
NEXT_PUBLIC_PUBLIC_VIEW_ENDPOINT=
NEXT_PUBLIC_PUBLIC_VIEW_ELEMENT_ENDPOINT=
```

Después de cambiar variables `NEXT_PUBLIC_*`, siempre hacer **Force rebuild**, no solo restart.

## Orden recomendado de despliegue

1. Desplegar backend corregido con bootstrap idempotente.
2. Verificar:

```bash
curl -i https://api.corazondemigrante.com/api/v1/public-views/1
curl -i https://api.corazondemigrante.com/api/v1/public/pages/inicio
curl -i https://api.corazondemigrante.com/api/v1/public/pages/biblioteca
curl -i https://api.corazondemigrante.com/api/v1/public/pages/biblioteca/elements/hero
curl -i https://api.corazondemigrante.com/api/v1/public-views/2
```

3. Recién después desplegar frontend.
4. Ejecutar:

```bash
yarn check:public-endpoints
```

## Nota honesta

El frontend quedó preparado para tolerar fallbacks entre endpoints públicos. Aun así, ningún frontend puede garantizar que no habrá problemas si el backend productivo devuelve 500, 404 o no tiene páginas sembradas. La garantía real se obtiene cuando `yarn check:public-endpoints` devuelve todos los endpoints en `[OK]`.

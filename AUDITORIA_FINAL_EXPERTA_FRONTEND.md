# Auditoría final experta - Corazón Migrante Frontend

## Resultado

Estado técnico auditado: **apto para despliegue condicionado a validación de backend público en producción**.

No es honesto prometer 100% absoluto sin ejecutar `next build` en el mismo sistema de Coolify y sin que producción responda todos los endpoints públicos. Sí se validó estáticamente y se corrigieron riesgos visibles del frontend.

## Validaciones ejecutadas en sandbox

- `tsc --noEmit`: OK
- `eslint . --max-warnings=0`: OK
- Verificación de rutas duplicadas Next/App Router: OK, 0 duplicadas
- Revisión de carga pública sin autenticación: OK
- Revisión de fallbacks landing/biblioteca: OK
- Limpieza de lenguaje técnico visible: OK

## Validaciones no ejecutadas completamente en sandbox

- `next build`: no se pudo ejecutar por binarios nativos SWC instalados para Windows en `node_modules` reutilizado. En Coolify/Linux debe ejecutarse con instalación limpia.
- `tsx tests/smoke/static-smoke.ts`: no se pudo ejecutar por binario `esbuild` de Windows reutilizado en Linux. En Windows local o Coolify con `yarn install` limpio debe ejecutarse.
- `yarn check:public-endpoints`: no se pudo ejecutar contra producción desde sandbox por DNS externo no resoluble. Debe correrse en tu PC o VPS.

## Correcciones finales aplicadas

- Se ocultó información técnica de endpoint en errores públicos de producción.
- Se eliminó lenguaje visible como `backend`, `JWT`, `PENDIENTE_CM` y mensajes de desarrollo en pantallas de usuario.
- Se mantuvo `endpoint` solo como propiedad interna/técnica, no como texto visible en producción.
- Se mantuvieron fallbacks de landing:
  - `/api/v1/public-views/1`
  - `/api/v1/public/pages/inicio`
- Se mantuvieron fallbacks de biblioteca:
  - `/api/v1/public/pages/biblioteca`
  - `/api/v1/public-views/2`
- Se confirmó que no hay duplicidad de ruta `/` por route groups.

## Riesgos reales antes de cliente

1. Si Coolify no hace Force Rebuild, puede seguir usando variables `NEXT_PUBLIC_*` viejas.
2. Si el backend no tiene sembradas `inicio` y `biblioteca`, el frontend mostrará error o biblioteca vacía.
3. Si se sube `node_modules` desde Windows a Linux, Next/SWC y esbuild pueden fallar. No subir `node_modules`.
4. Las transiciones 3D fuertes no se recomiendan para este producto. Microinteracciones sobrias sí.

## Comandos obligatorios antes de mostrar al cliente

```powershell
yarn install
yarn typecheck
yarn lint
yarn build
yarn test:unit
yarn test:smoke
yarn check:public-endpoints
```

## Variables recomendadas en Coolify frontend

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

## Veredicto

Frontend visual y funcionalmente más sólido que la versión anterior. Apto para seguir hacia cliente si el build real y endpoints públicos pasan. Calificación técnica estricta: **9.1/10**.

# Módulo Biblioteca / CMS público — Corazón Migrante

## Decisión corregida

El módulo ya no usa endpoints inventados de artículos. El backend real trabaja con páginas CMS y elementos:

- `GET /api/v1/public/pages/:slug`
- `POST /api/v1/admin/cms/pages`
- `POST /api/v1/admin/cms/pages/:pageId/elements`
- `POST /api/v1/files`

La ruta pública `/biblioteca` lee el slug configurado por `NEXT_PUBLIC_CMS_LIBRARY_SLUG`, por defecto `biblioteca`.

## Servidor de archivos por env

Se restauró la lógica que antes existía en `ROUTES_FILE_SERVER`, pero adaptada a Next.js:

- `NEXT_PUBLIC_FILE_SERVER_LOGO_URL`
- `NEXT_PUBLIC_FILE_SERVER_AUTH_IMAGE_URL`
- `NEXT_PUBLIC_FILE_SERVER_EDITORIAL_HERO_IMAGE_URL`
- `NEXT_PUBLIC_FILE_SERVER_EDITORIAL_FALLBACK_IMAGE_URL`
- `NEXT_PUBLIC_FILE_SERVER_PUBLIC_ASSETS_BASE_URL`
- URLs JSON de especialidades, profesiones, países/ciudades, ocupaciones, síntomas y objetivos.

Si el CMS no envía imagen, la biblioteca usa imagen visual por defecto del servidor de archivos. Esto no simula contenido de negocio; solo evita una pantalla visualmente pobre.

## Imágenes CMS

El backend permite `POST /api/v1/files` con:

```txt
module=CMS
visibility=PUBLIC
entityType=CmsElement
```

El upload devuelve metadata. Si la respuesta contiene `publicUrl`, `url` u `objectKey`, el frontend puede usarlo en `content.imageUrl`. Si solo devuelve `objectKey`, se construye con `NEXT_PUBLIC_FILE_SERVER_PUBLIC_ASSETS_BASE_URL`.

## Gap backend detectado

PENDIENTE_CM_BACKEND_CMS_PUBLIC_ASSET_URL: el backend todavía no expone una ruta pública para resolver `fileId` CMS a URL pública. `GET /api/v1/files/:id/signed-url` requiere autenticación. Para CMS público, lo ideal es que `GET /api/v1/public/pages/:slug` devuelva `content.imageUrl` ya resuelto o incluya assets públicos firmados/estáticos.

# Assets de imágenes (Cloudinary) — URLs listas

Cloud de Cloudinary del proyecto: **`sfyimi9x`**
Base: `https://res.cloudinary.com/sfyimi9x/image/upload`

> ⚠️ Importante: las variables `NEXT_PUBLIC_*` se **congelan en el build**.
> Si cambias una URL, ponla también en las variables de entorno de **Cloudflare Pages**
> y lanza un **deploy nuevo** (no "Retry" del deploy viejo).

---

## 1. Guillermo Rivera — Médico Psiquiatra ❌ (sale vacío)

- **Variable .env:** `NEXT_PUBLIC_FILE_SERVER_DOCTOR_GUILLERMO_URL`
- **Se usa en:** `src/features/public-view/landing-assets.ts` (array `SPECIALISTS`)
- **URL por defecto (NO existe todavía en Cloudinary):**

```
https://res.cloudinary.com/sfyimi9x/image/upload/corazon-migrante/landing_page/media/doctor-guillermo.webp
```

**URL LISTA para pegar** (elige una opción):

- **Opción A — subes la foto** a la carpeta `corazon-migrante/landing_page/media/` con el nombre `doctor-guillermo.webp`. Entonces la URL lista es exactamente la de arriba y no hay que tocar nada.
- **Opción B — ya la tienes subida en el CMS.** Copia su URL de tu Media Library (tendrá esta forma) y pégala en la variable:

```
NEXT_PUBLIC_FILE_SERVER_DOCTOR_GUILLERMO_URL=https://res.cloudinary.com/sfyimi9x/image/upload/vXXXXXXXXXX/corazon-migrante/public/cms/.../XXXX.png
```

---

## 2. Daniel Limpias — Psicólogo ❌ (sale vacío)

- **Variable .env:** `NEXT_PUBLIC_FILE_SERVER_DOCTOR_DANIEL_URL`
- **Se usa en:** `src/features/public-view/landing-assets.ts` (array `SPECIALISTS`)
- **URL por defecto (NO existe todavía en Cloudinary):**

```
https://res.cloudinary.com/sfyimi9x/image/upload/corazon-migrante/landing_page/media/doctor-daniel.webp
```

**URL LISTA para pegar** (elige una opción):

- **Opción A — subes la foto** a `corazon-migrante/landing_page/media/` con el nombre `doctor-daniel.webp`. La URL lista es la de arriba.
- **Opción B — ya está en el CMS.** Copia su URL y pégala:

```
NEXT_PUBLIC_FILE_SERVER_DOCTOR_DANIEL_URL=https://res.cloudinary.com/sfyimi9x/image/upload/vXXXXXXXXXX/corazon-migrante/public/cms/.../XXXX.png
```

---

## Referencia — especialistas que SÍ se ven (formato correcto)

Estos ya funcionan porque usan una URL completa de un archivo que existe:

- **Marlene Cossio (Psicóloga Clínica):**
  `https://res.cloudinary.com/sfyimi9x/image/upload/v1784814026/corazon-migrante/public/cms/1ae48a3b-b7cb-424b-baa4-635c93e4031b/1bc90482-903f-4afb-9c88-22fbbbc5008e.png`
- **Diane Wimberly (Psicóloga):**
  `https://res.cloudinary.com/sfyimi9x/image/upload/v1784814028/corazon-migrante/public/cms/1ae48a3b-b7cb-424b-baa4-635c93e4031b/a2b41771-16ea-4352-8de9-fa0aa2a799df.png`

---

## Otros assets ya configurados (`.env`)

| Variable | URL |
|----------|-----|
| `NEXT_PUBLIC_FILE_SERVER_LOGO_URL` | `.../corazon-migrante/global_assets/media/logo-corazon-migrante.png` |
| `NEXT_PUBLIC_FILE_SERVER_AUTH_IMAGE_URL` | `.../landing_page/media/story.webp` |
| `NEXT_PUBLIC_FILE_SERVER_LANDING_HERO_IMAGE_URL` | `.../landing_page/media/carrusel-2.webp` |
| `NEXT_PUBLIC_FILE_SERVER_THERAPY_IMAGE_URL` | `.../landing_page/media/mission.webp` |
| `NEXT_PUBLIC_FILE_SERVER_FAMILY_IMAGE_URL` | `.../landing_page/media/carrusel-4.webp` |
| `NEXT_PUBLIC_FILE_SERVER_LIBRARY_IMAGE_URL` | `.../landing_page/media/carrusel-6.webp` |
| `NEXT_PUBLIC_FILE_SERVER_EDITORIAL_HERO_IMAGE_URL` | `.../landing_page/media/carrusel-3.webp` |
| `NEXT_PUBLIC_FILE_SERVER_EDITORIAL_FALLBACK_IMAGE_URL` | `.../landing_page/media/carrusel-1.webp` |
| `NEXT_PUBLIC_FILE_SERVER_PUBLIC_ASSETS_BASE_URL` | `.../corazon-migrante` |

---

## Banners (publicidad)

Los "banners" del panel de publicidad **no son archivos fijos**: se suben desde el
admin (`Logo o banner`, campo `logoFile`) y se guardan vía backend → Cloudinary.
No se configuran por `.env`. Si un banner sale vacío, revisa que la campaña tenga su
creativo subido en el panel de admin.

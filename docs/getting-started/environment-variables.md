# Variables de entorno

- **Fecha de evidencia:** 2026-08-03
- **Fuente de verdad:** [src/config/env.ts](../../src/config/env.ts) · Plantilla: [.env.example](../../.env.example)

## 1. Las tres reglas

1. **Todas llevan prefijo `NEXT_PUBLIC_` y se incrustan en el bundle en tiempo de build.** Cambiar una exige **reconstruir**.
2. **Ninguna puede ser un secreto.** Son públicas por definición.
3. **Se leen siempre a través de `env`**, nunca con `process.env` directo.

## 2. Mínimo para desarrollar

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:4173
```

⚠️ **El backend y el frontend deben estar en puertos distintos.** `apiBaseUrl()` rechaza explícitamente que la variable apunte al propio origen del frontend en `localhost`, con este mensaje:

> *«NEXT_PUBLIC_API_BASE_URL está apuntando a la aplicación frontend. Este proyecto corre por defecto en 4173; configura el servidor en otro puerto, por ejemplo NEXT_PUBLIC_API_BASE_URL=http://localhost:3000.»*

El prefijo `/api/v1` **no** debe incluirse: `ENDPOINTS` ya lo aporta. Si se incluye, `apiBaseUrl()` lo recorta para evitar `/api/v1/api/v1/...`.

## 3. Catálogo

### Identidad

| Variable | Por defecto | Uso |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | «Corazón Migrante» | `applicationName`, Open Graph |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:4173` | `metadataBase` → URLs canónicas y Open Graph |

### Backend

| Variable | Por defecto | Si falta |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | — | `ApiError(…, 500)` en la primera llamada |

### Contenido público

| Variable | Por defecto |
|---|---|
| `NEXT_PUBLIC_PUBLIC_VIEW_SLUG` | `inicio` (acepta el valor heredado `"1"`) |
| `NEXT_PUBLIC_CMS_LIBRARY_SLUG` | `biblioteca` (acepta `"2"`) |
| `NEXT_PUBLIC_PUBLIC_VIEW_CODE` · `_ENDPOINT` · `_ELEMENT_ENDPOINT` | — |
| `NEXT_PUBLIC_PUBLIC_CONTACT_PHONE` | — |

### Medios (Cloudinary) — 17 variables

`NEXT_PUBLIC_FILE_SERVER_` + `LOGO_URL`, `AUTH_IMAGE_URL`, `LANDING_HERO_IMAGE_URL`, `THERAPY_IMAGE_URL`, `FAMILY_IMAGE_URL`, `LIBRARY_IMAGE_URL`, `EDITORIAL_HERO_IMAGE_URL`, `EDITORIAL_FALLBACK_IMAGE_URL`, `PUBLIC_ASSETS_BASE_URL`, `SPECIALTIES_URL`, `PROFESSIONS_URL`, `COUNTRIES_CITIES_URL`, `OCCUPATIONS_URL`, `SYMPTOMS_URL`, `THERAPY_GOALS_URL`, `DOCTOR_GUILLERMO_URL`, `DOCTOR_DANIEL_URL`.

Todas opcionales. Si faltan, `SmartImage` aplica su imagen de respaldo — **silenciosamente**. Ver [../operations/runbooks/imagenes-no-disponibles.md](../operations/runbooks/imagenes-no-disponibles.md).

### Banderas

| Variable | Por defecto | Efecto |
|---|---|---|
| `NEXT_PUBLIC_TUTORIALS_REMOTE_PROGRESS` | `false` | Con `false`, el progreso vive solo en el navegador |

Acepta `"true"`, `"1"` u `"on"`. **Cualquier otro valor la desactiva.**

## 4. Comportamiento defensivo del esquema

| Ayudante | Efecto |
|---|---|
| `optionalUrl` | `""` → `undefined` antes de validar el formato |
| `booleanFlag` | `"true"`/`"1"`/`"on"` → `true`; el resto → `false` |
| `publicPageSlugWithDefault` | `"1"` → `inicio`, `"2"` → `biblioteca` |

**Consecuencia importante: el build no falla si falta una variable relevante.** Con `NEXT_PUBLIC_API_BASE_URL` ausente, la aplicación se construye y despliega, y solo falla al pedir datos.

## 5. ⚠️ Las variables de CI están desalineadas

| Definida en `ci.yml` | Esperada por el esquema |
|---|---|
| `NEXT_PUBLIC_API_URL` | `NEXT_PUBLIC_API_BASE_URL` ❌ |
| `NEXT_PUBLIC_PUBLIC_ASSETS_BASE_URL` | `NEXT_PUBLIC_FILE_SERVER_PUBLIC_ASSETS_BASE_URL` ❌ |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | No existe ❌ |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | No existe ❌ |
| `NEXT_PUBLIC_APP_URL` | ✅ |

Combinado con el §4: **CI construye sin API configurada y el build pasa**. Brecha `OPS-01`, severidad HIGH.

## 6. Dónde se define cada entorno

| Entorno | Origen |
|---|---|
| Desarrollo | `.env` / `.env.local` (en `.gitignore`) |
| CI | Bloque `env` de `ci.yml` |
| Producción | Panel de Cloudflare Pages |

## 7. Al añadir una variable

1. Declararla en `envSchema` con el tipo y el valor por defecto adecuados.
2. Añadirla a `.env.example`.
3. Añadirla a `ci.yml` si el build la necesita.
4. Añadirla al panel de Cloudflare Pages.
5. Documentarla en [../operations/configuration.md](../operations/configuration.md) y en esta página.
6. Si es realmente obligatoria, **declararla sin `.optional()`** para que el build falle si falta.

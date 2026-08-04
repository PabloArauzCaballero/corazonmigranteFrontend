# Configuración

- **Fecha de evidencia:** 2026-08-03
- **Fuente única de verdad:** [src/config/env.ts](../../src/config/env.ts)

## 1. Principio

**Toda variable de entorno se lee a través de `env`, nunca con `process.env` directo.**

`envSchema.parse()` se ejecuta al importar el módulo: si el entorno es inválido, **la aplicación no arranca**. Fallar pronto y de forma explícita es preferible a desplegar algo que romperá en la primera petición.

## 2. Las variables, por grupo

### Identidad

| Variable | Tipo | Por defecto |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | `string` | «Corazón Migrante» |
| `NEXT_PUBLIC_APP_URL` | URL | `http://localhost:4173` |

`NEXT_PUBLIC_APP_URL` alimenta `metadataBase`, y de ahí las URLs canónicas y de Open Graph. El código señala que **antes apuntaba a `localhost:3000`, que es el backend**, y generaba metadatos incorrectos.

### Backend

| Variable | Tipo | Efecto si falta |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | URL opcional | `ApiError(…, 500)` en la primera llamada |

Opcional en el esquema para que el build no falle sin backend; **imprescindible en la práctica**.

### Contenido público

| Variable | Notas |
|---|---|
| `NEXT_PUBLIC_PUBLIC_VIEW_SLUG` | Por defecto `inicio`. Acepta el valor heredado `"1"` |
| `NEXT_PUBLIC_CMS_LIBRARY_SLUG` | Por defecto `biblioteca`. Acepta `"2"` |
| `NEXT_PUBLIC_PUBLIC_VIEW_CODE` · `_ENDPOINT` · `_ELEMENT_ENDPOINT` | Opcionales |
| `NEXT_PUBLIC_PUBLIC_CONTACT_PHONE` | Teléfono público |

### Medios — 15 variables `NEXT_PUBLIC_FILE_SERVER_*`

`LOGO_URL`, `AUTH_IMAGE_URL`, `LANDING_HERO_IMAGE_URL`, `THERAPY_IMAGE_URL`, `FAMILY_IMAGE_URL`, `LIBRARY_IMAGE_URL`, `EDITORIAL_HERO_IMAGE_URL`, `EDITORIAL_FALLBACK_IMAGE_URL`, `PUBLIC_ASSETS_BASE_URL`, `SPECIALTIES_URL`, `PROFESSIONS_URL`, `COUNTRIES_CITIES_URL`, `OCCUPATIONS_URL`, `SYMPTOMS_URL`, `THERAPY_GOALS_URL`, `DOCTOR_GUILLERMO_URL`, `DOCTOR_DANIEL_URL`.

Todas son `optionalUrl`: una cadena vacía se convierte en `undefined` y `SmartImage` aplica su respaldo. Ver [runbooks/imagenes-no-disponibles.md](runbooks/imagenes-no-disponibles.md).

### Banderas

| Variable | Tipo | Por defecto |
|---|---|---|
| `NEXT_PUBLIC_TUTORIALS_REMOTE_PROGRESS` | booleano | `false` |

Única bandera del proyecto. Ver [feature-flags.md](feature-flags.md).

## 3. Preprocesado defensivo

| Ayudante | Comportamiento |
|---|---|
| `optionalUrl` | `""` → `undefined` antes de validar formato |
| `booleanFlag` | `"true"`, `"1"`, `"on"` → `true`; el resto → `false` |
| `publicPageSlugWithDefault` | `"1"` → `inicio`, `"2"` → `biblioteca` |

`booleanFlag` merece una nota: **cualquier valor distinto de los tres aceptados desactiva la bandera**. Un `"yes"` o un `"TRUE "` con espacio se resuelven bien (hay `trim()` y `toLowerCase()`), pero `"enabled"` no.

## 4. Consecuencia estructural

**Todas las variables llevan prefijo `NEXT_PUBLIC_` y se incrustan en el bundle durante el build.**

| Implicación | Detalle |
|---|---|
| No hay configuración en tiempo de ejecución | Cambiar una variable exige reconstruir y desplegar |
| **Ninguna variable puede ser un secreto** | Son públicas por definición |
| El mismo commit produce artefactos distintos | Según el entorno de build |

Se verificó que **ninguna variable actual es un secreto**: URLs de API y de Cloudinary, slugs, un teléfono público y una bandera.

## 5. Dónde se define cada entorno

| Entorno | Origen |
|---|---|
| Desarrollo | `.env` / `.env.local` (en `.gitignore`) |
| CI | Bloque `env` de `ci.yml` — ⚠️ **con nombres obsoletos** (`OPS-01`) |
| Producción | Panel de Cloudflare Pages |

Plantilla en [.env.example](../../.env.example).

## 6. Reglas

1. Toda variable nueva se declara en `envSchema` **y** en `.env.example`.
2. Nunca leer `process.env` fuera de `config/env.ts`.
3. Nunca poner un secreto en una variable `NEXT_PUBLIC_*`.
4. Una variable realmente obligatoria debe declararse sin `.optional()`, para que el build falle si falta.
5. Al añadir una variable, actualizar también `ci.yml` y el panel de Cloudflare Pages.

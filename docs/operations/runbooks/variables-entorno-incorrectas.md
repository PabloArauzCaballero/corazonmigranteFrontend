# Runbook — Variables de entorno incorrectas

## Síntoma

Alguno de estos:

- «NEXT_PUBLIC_API_BASE_URL no está configurado. Revisa .env.local.»
- Todas las peticiones fallan o van a un backend equivocado.
- Las imágenes muestran el respaldo genérico.
- URLs canónicas u Open Graph con el dominio incorrecto.
- Se cambió una variable en el panel y **no pasó nada**.

## Impacto

De cosmético (una imagen de respaldo) a total (sin API).

## La regla que explica casi todos los casos

> **Las variables `NEXT_PUBLIC_*` se incrustan en el bundle durante el build.**

Cambiar una variable en el panel de Cloudflare Pages y reiniciar **no tiene ningún efecto**. Hay que **reconstruir y volver a desplegar**. Es la causa más frecuente de «lo cambié y sigue igual».

## Diagnóstico seguro

```bash
# ¿Qué valor quedó incrustado en el artefacto?
grep -ro "https://[a-z0-9.-]*/api" out/_next/static/chunks/ | head -5
```

En el navegador → Network: comprobar el host real de las peticiones a `/api/v1/*`.

Comparar el panel de Cloudflare Pages con [.env.example](../../../.env.example) y con el esquema de [src/config/env.ts](../../../src/config/env.ts).

## Comportamiento del esquema

`envSchema` es **defensivo a propósito**:

| Preprocesado | Efecto |
|---|---|
| `optionalUrl` | `""` → `undefined`; una variable declarada pero vacía no rompe el build |
| `booleanFlag` | `"true"`, `"1"`, `"on"` → `true`; cualquier otra cosa → `false` |
| `publicPageSlugWithDefault` | `"1"` → `"inicio"`, `"2"` → `"biblioteca"` (valores heredados) |
| Valores por defecto | `NEXT_PUBLIC_APP_NAME` → «Corazón Migrante», `NEXT_PUBLIC_APP_URL` → `http://localhost:4173` |

**Consecuencia crítica:** el build **no falla** si faltan variables importantes. Con `NEXT_PUBLIC_API_BASE_URL` ausente, la aplicación se construye y despliega, y solo falla al pedir datos.

## Problema conocido: las variables del pipeline son obsoletas

| Definida en `ci.yml` | Esperada por el esquema |
|---|---|
| `NEXT_PUBLIC_API_URL` | `NEXT_PUBLIC_API_BASE_URL` ❌ |
| `NEXT_PUBLIC_PUBLIC_ASSETS_BASE_URL` | `NEXT_PUBLIC_FILE_SERVER_PUBLIC_ASSETS_BASE_URL` ❌ |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | No existe en el esquema ❌ |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | No existe en el esquema ❌ |
| `NEXT_PUBLIC_APP_URL` | ✅ Correcta |

**CI construye sin API configurada, y pasa.** Brecha `OPS-01`, severidad HIGH. Ver [../deployment.md §5](../deployment.md).

## Evidencia a recoger

- Lista de variables del entorno afectado (todas son públicas: pueden compartirse).
- Host real de las peticiones.
- Hora del último build frente a hora del último cambio de variable.

## Mitigación

1. Corregir el valor en el panel de Cloudflare Pages (o en `.env.local`).
2. **Reconstruir y volver a desplegar.** Sin esto no hay efecto.
3. Verificar con el smoke de [../deployment.md §7](../deployment.md).

## Rollback

Volver al despliegue anterior si el valor anterior era correcto.

## Prevención

1. Mantener [.env.example](../../../.env.example) sincronizado con `src/config/env.ts`.
2. Corregir los nombres de las variables en `ci.yml` (`OPS-01`).
3. Considerar hacer `NEXT_PUBLIC_API_BASE_URL` **obligatoria** en el esquema: convertiría un fallo silencioso en producción en un build fallido. Es `CAMBIO DE PRODUCTO`, con la contrapartida de que impediría construir sin backend configurado.

## Escalado

Quien gestione la configuración de Cloudflare Pages. Sin definir en el repositorio (`OPS-05`).

# Caché y CDN

- **Fecha de evidencia:** 2026-08-03
- **Evidencia:** [public/_headers](../../public/_headers)

## 1. Política vigente

| Ruta | `Cache-Control` | Motivo |
|---|---|---|
| `/_next/static/*` | `public, max-age=31536000, immutable` | Los bundles llevan hash: su contenido nunca cambia |
| `/admin/*` | `no-store` | Datos personales; nunca en caché compartida |
| `/paciente/*` | `no-store` | Ídem |
| `/terapeuta/*` | `no-store` | Ídem |
| Resto | Por defecto de Cloudflare Pages | HTML público |

## 2. Por qué `immutable` es seguro aquí

Un archivo como `chunks/5964-fee80267d284c734.js` contiene el hash de su propio contenido. Si el contenido cambia, cambia el nombre. Cachearlo un año es correcto y elimina descargas repetidas.

**El efecto secundario** es el `ChunkLoadError` en pestañas abiertas durante un despliegue: el HTML antiguo pide chunks que ya no existen en el origen. Ver [runbooks/chunks-fallidos.md](runbooks/chunks-fallidos.md).

## 3. Por qué `no-store` en los portales

Con `output: "export"`, el HTML de `/admin`, `/paciente` y `/terapeuta` es estático. **No contiene datos personales** — estos se cargan por API tras la hidratación.

Aun así, `no-store` es la decisión correcta:

1. Evita que un proxy compartido conserve páginas de portal.
2. Garantiza que se obtiene el HTML más reciente, reduciendo la ventana del `ChunkLoadError`.
3. Es defensa en profundidad: si algún día una pantalla llegara a prerenderizar datos, la caché no los propagaría.

Combinado con `X-Robots-Tag: noindex, nofollow`, cierra el riesgo de que un portal privado acabe indexado o cacheado.

## 4. Caché del HTML público

Las rutas públicas no llevan `Cache-Control` explícito: rige el valor por defecto de Cloudflare Pages.

**Consecuencia para el equipo editorial:** el contenido del CMS **no se refresca solo**. Hay dos capas que lo impiden:

1. `/[slug]` usa `generateStaticParams()`, que se ejecuta **en build**. Una página nueva no existe hasta el siguiente despliegue.
2. El HTML servido puede además estar cacheado en el borde.

Es la consecuencia más importante de la exportación estática para quien publica contenido, y la razón de que exista `FALLBACK_PUBLIC_SLUGS`. Ver [../business/user-journeys.md#j8](../business/user-journeys.md).

## 5. Caché de datos en el cliente

React Query con `staleTime: 30 s`. Los datos se consideran frescos durante 30 segundos y no se refetchean al remontar o volver a enfocar la ventana.

**La caché no se persiste**: vive en memoria y se pierde al recargar. Es una propiedad de privacidad relevante — ningún dato de paciente queda en disco. Ver [../security/privacy.md §2](../security/privacy.md).

## 6. Invalidación

| Capa | Cómo se invalida |
|---|---|
| React Query | `queryClient.invalidateQueries({ queryKey })` |
| `/_next/static/*` | Automática: hash nuevo = URL nueva |
| HTML | Nuevo despliegue |
| Contenido CMS | **Requiere reconstruir** |
| Borde de Cloudflare | Purga desde el panel |

## 7. Recomendación

Definir explícitamente el `Cache-Control` del HTML público en `_headers`, en lugar de depender del valor por defecto de la plataforma. Un `max-age` corto con `stale-while-revalidate` daría control sobre la frescura del contenido editorial sin renunciar al rendimiento del borde.

Sería `CAMBIO DE PRODUCTO`. Registrado como propuesta, no implementada.

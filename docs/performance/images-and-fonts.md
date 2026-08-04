# Imágenes y fuentes

- **Fecha de evidencia:** 2026-08-03

## 1. Imágenes

### `images.unoptimized: true` — obligatorio, no opcional

`output: "export"` es incompatible con el optimizador de imágenes de Next.js, que necesita un servidor. La consecuencia es que **no hay `srcset`, ni conversión automática a AVIF/WebP, ni redimensionado por dispositivo** provistos por el framework.

### `SmartImage` — el sustituto

[src/shared/ui/smart-image.tsx](../../src/shared/ui/smart-image.tsx) cubre lo que se perdió:

| Capacidad | Implementación |
|---|---|
| Validación de origen | `isValidSrc()` rechaza `null`, `undefined`, `about:blank` y cadenas vacías |
| Imagen de respaldo | `fallbackSrc`, intentada **una sola vez** — sin bucles de error |
| Estabilidad de layout | `aspectRatio` reserva el espacio → evita CLS |
| Estado de carga | Placeholder shimmer en lugar de un hueco vacío |
| Prioridad | `priority` para el hero |

Lo que **no** cubre: generación de variantes por tamaño. Eso lo aporta Cloudinary a través de la URL, si las URLs configuradas incluyen las transformaciones adecuadas.

### Cloudinary

Todas las imágenes se sirven desde Cloudinary. Las URLs llegan por más de una docena de variables `NEXT_PUBLIC_FILE_SERVER_*`, lo que significa que **la calidad y el formato dependen de cómo esté construida cada URL configurada**, no del código.

Cloudinary admite transformaciones en la URL (`f_auto,q_auto` para formato y calidad automáticos). **No se ha verificado** que las URLs configuradas las usen. Es una optimización de alto impacto y coste cero en código: registrada como `PERF-04`.

Ver [../CLOUDINARY-ASSETS.md](../CLOUDINARY-ASSETS.md) y [scripts/audit-media-assets.mjs](../../scripts/audit-media-assets.mjs).

### Presupuestos

| Recurso | Presupuesto | Estado |
|---|---|---|
| Imagen del hero | ≤ 200 kB | Sin medir |
| Total de imágenes por página | ≤ 1 MB | Sin medir |
| Formato | AVIF o WebP preferidos | Depende de la URL de Cloudinary |

---

## 2. Fuentes

### Dos familias, cargadas con `next/font/google`

```ts
const fraunces = Fraunces({ subsets: ["latin"], style: ["normal", "italic"], variable: "--font-display", display: "swap" });
const manrope  = Manrope({  subsets: ["latin"],                              variable: "--font-sans",    display: "swap" });
```

| Decisión | Efecto |
|---|---|
| **Fuentes variables sin `weight`** | Un único archivo por familia cubre todo el rango de grosores |
| `subsets: ["latin"]` | Descarta glifos innecesarios |
| `display: "swap"` | Texto visible desde el primer momento con la fuente de respaldo |
| `next/font/google` | Las descarga **en build** y las sirve desde el propio origen: sin petición a Google en tiempo de ejecución |

El comentario del código cuantifica la mejora de las fuentes variables: antes eran *«5 pesos × 2 estilos = 10 descargas solo para los títulos»*. Ahora es **una** por familia.

### El compromiso de `display: "swap"`

| | `swap` (elegido) | `optional` | `block` |
|---|---|---|---|
| Texto visible de inmediato | ✅ | ✅ | ❌ (FOIT) |
| Salto visual al cambiar | ⚠️ Sí (FOUT) | Mínimo | No |
| Impacto en CLS | ⚠️ Posible | Bajo | Bajo |

`swap` prioriza que el contenido sea legible cuanto antes. Para una aplicación dirigida a personas en conexiones limitadas, es la elección correcta: es preferible un salto tipográfico a un párrafo invisible durante segundos.

### Que la CSP siga permitiendo Google Fonts

`_headers` mantiene `fonts.googleapis.com` en `style-src` y `fonts.gstatic.com` en `font-src`, pese a que `next/font` autoaloja. Es una salvaguarda razonable —cubre cualquier ruta de carga residual— y no supone riesgo.

---

## 3. Iconos

**Conviven dos sistemas**, lo que es una duplicación real:

| Sistema | Uso | Coste |
|---|---|---|
| `lucide-react` | Predominante: `state.tsx`, `button.tsx`, `data-table.tsx`, `toast.tsx`, navegación | Bajo con importaciones nombradas y *tree-shaking* |
| `fontawesome.tsx` | [src/shared/ui/fontawesome.tsx](../../src/shared/ui/fontawesome.tsx) | Sin cuantificar |

Mantener dos familias de iconos añade peso y produce inconsistencia visual. Registrado como `PERF-05`, severidad LOW. Consolidar sería `CAMBIO DE PRODUCTO`.

---

## 4. Oportunidades detectadas

Ordenadas por relación impacto/esfuerzo. **Ninguna se implementa aquí.**

| # | Oportunidad | Impacto | Esfuerzo |
|---:|---|---|---|
| 1 | Verificar y añadir `f_auto,q_auto` a las URLs de Cloudinary | **Alto** | **Muy bajo** — es configuración, no código |
| 2 | Comprobar `priority` en la imagen LCP de `/` | Alto | Muy bajo |
| 3 | Medir el peso real de las imágenes de la landing | Diagnóstico | Bajo |
| 4 | Consolidar en una sola familia de iconos | Bajo | Medio |
| 5 | Evaluar `display: "optional"` para la fuente display | Bajo | Bajo, pero afecta a la percepción visual |

La número 1 es la de mejor retorno de todo el capítulo de rendimiento: no toca una línea de código y puede reducir sustancialmente el peso de la ruta más visitada.

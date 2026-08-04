# Core Web Vitals

- **Fecha de evidencia:** 2026-08-03

## 1. Estado: instrumentado, no medido

| Pieza | Estado |
|---|---|
| Recogida en el cliente | ✅ [`use-web-vitals.ts`](../../src/observability/react/use-web-vitals.ts), montado vía `TelemetryProvider` |
| Envío al colector | ✅ Como trazas OTLP a `/otel/v1/traces` |
| Agregación y panel | ❌ **No existe en el repositorio** |
| Umbrales y alertas | ❌ No definidos |
| Medición de campo (RUM público) | ❌ No disponible |
| Medición de laboratorio (Lighthouse) | ❌ Sin herramienta instalada |

**Es la brecha `PERF-02`:** se está recogiendo el dato y nadie lo mira. El trabajo de instrumentación está hecho; falta el consumo.

## 2. Cómo se recogen

`TelemetryProvider` monta `useWebVitals()` dentro de `SessionProvider` y **antes** del resto de providers, para no perder ninguna navegación. Cada métrica se convierte en un span con atributos de la lista blanca de `tracing.attributes.ts`.

La ruta se registra como **plantilla** (`/admin/users/:id`), no como URL concreta: evita cardinalidad ilimitada y fuga de identificadores. Ver [../security/privacy.md](../security/privacy.md).

## 3. Factores arquitectónicos por métrica

### LCP — probable elemento: el hero de `/`

| Factor | Efecto | Estado |
|---|---|---|
| HTML estático desde el borde | ✅ Muy favorable | Sin servidor de aplicación en el camino |
| `images.unoptimized: true` | ⚠️ Desfavorable | Sin `srcset` ni AVIF/WebP automáticos por Next |
| Cloudinary | ✅ Favorable | Puede servir formatos modernos vía URL |
| `SmartImage` con `priority` | ✅ Favorable | Carga inmediata para el hero |
| 194 kB de JS en `/` | ⚠️ Desfavorable | Compite por ancho de banda con la imagen |

### INP — riesgo bajo

Sin scripts de terceros y sin trabajo pesado en el hilo principal detectado. React Query con `staleTime: 30 s` evita refetches innecesarios que provocarían re-renders.

### CLS — bien atendido

| Mecanismo | Efecto |
|---|---|
| `SmartImage` con `aspectRatio` | Reserva el espacio antes de cargar |
| `DataTableSkeleton` | Ocupa el sitio de la tabla real |
| `display: "swap"` en las fuentes | ⚠️ Provoca FOUT: el texto salta al cambiar de fuente |
| Estados de `state.tsx` con `min-h-48` | Altura mínima estable |

`aspectRatio` en `SmartImage` está explícitamente documentado en el código como «Evita CLS». Es la mitigación correcta.

El único riesgo real es el intercambio de fuentes. Con `display: "swap"` se prioriza que el texto sea legible cuanto antes, a costa de un salto visual. Es la elección correcta para accesibilidad; el impacto en CLS depende de cuánto difieran las métricas de la fuente de respaldo y la definitiva.

## 4. Verificación manual

Sin herramienta en el repositorio:

1. Chrome DevTools → Lighthouse, en modo móvil con CPU ralentizada 4×.
2. Rutas prioritarias: `/` (la más pesada y más visitada), `/login`, `/paciente/citas`, `/admin`.
3. PageSpeed Insights sobre el dominio en producción, para datos de campo si hay tráfico suficiente.

## 5. Propuesta

`INSTRUMENTACIÓN SEGURA` — no implementada:

| # | Acción | Valor |
|---:|---|---|
| 1 | Panel en el colector con LCP/INP/CLS por plantilla de ruta | **Alto** — cierra el bucle de la instrumentación ya existente |
| 2 | Alerta al superar el umbral «Necesita mejora» durante 24 h | Alto |
| 3 | Lighthouse CI sobre 4 rutas representativas | Medio |

La acción 1 no requiere tocar el frontend en absoluto: el dato ya está saliendo. Es la de mejor relación coste/beneficio de todo el apartado de rendimiento.

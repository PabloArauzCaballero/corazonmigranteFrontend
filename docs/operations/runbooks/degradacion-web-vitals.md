# Runbook — Degradación de Core Web Vitals

## Síntoma

La aplicación se percibe lenta: tarda en pintar, los clics no responden, el contenido salta al cargar.

## Impacto

Abandono. En una aplicación dirigida a personas que pueden estar en conexiones limitadas y en situación de estrés, la lentitud se traduce directamente en que no piden ayuda.

## Limitación del diagnóstico

**No hay panel de Web Vitals** (brecha `PERF-02`). Los datos se recogen y se envían al colector, pero nadie los agrega. El diagnóstico es por tanto manual.

## Diagnóstico seguro

```bash
# Comparar el bundle con la línea base documentada
rm -rf .next out && yarn build
```

Contrastar con [../../performance/budgets.md](../../performance/budgets.md):

| Métrica | Línea base 2026-08-03 | Presupuesto |
|---|---:|---:|
| JS compartido | 100 kB | ≤ 110 kB |
| First Load de `/` | 194 kB | ≤ 210 kB |
| Máximo en cualquier ruta | 194 kB | ≤ 220 kB |

En el navegador: Lighthouse en modo móvil con CPU ralentizada 4×, sobre `/`, `/login` y una ruta de portal.

## Causas por orden de probabilidad

| # | Causa | Cómo confirmarla |
|---:|---|---|
| 1 | Dependencia nueva pesada | El JS compartido supera los 110 kB |
| 2 | Imágenes sin optimizar en `/` | Network: peso de las imágenes |
| 3 | Backend lento | Spans `http.client` con duración alta |
| 4 | CLS por imágenes sin `aspectRatio` | Lighthouse señala los elementos que se desplazan |
| 5 | Coste de OpenTelemetry | `PERF-03` — **sin medir** |
| 6 | Renders en cascada | React DevTools Profiler |

**Sobre la causa 3, una distinción importante:** si el backend responde lento, LCP e INP pueden empeorar sin que el frontend haya cambiado nada. Los spans `http.client` permiten separar «la aplicación es lenta» de «la API es lenta», y es la primera pregunta que conviene responder.

**Sobre la causa 5:** once dependencias de OpenTelemetry entraron en producción y su coste en bundle nunca se comparó contra [../../observability/frontend/bundle-baseline.md](../../observability/frontend/bundle-baseline.md), que existe precisamente para eso. Si la degradación coincidió con la incorporación de observabilidad, es la primera hipótesis a descartar.

## Evidencia a recoger

- Tabla completa de rutas del build actual frente a la línea base.
- Informe de Lighthouse de las rutas afectadas.
- Duración de los spans `http.client` por endpoint.
- Fecha del último despliegue frente al inicio de la degradación.

## Mitigación

Depende de la causa:

| Causa | Acción |
|---|---|
| 1 | Evaluar si la dependencia es necesaria; cargarla de forma diferida si solo la usa una ruta |
| 2 | Añadir `f_auto,q_auto` a las URLs de Cloudinary — **coste cero en código** |
| 3 | Corresponde al backend |
| 4 | Añadir `aspectRatio` a `SmartImage` en los puntos afectados |
| 5 | Medir y decidir sobre el muestreo (`browser-sampling.ts`) |
| 6 | El lint con `react-hooks` detecta buena parte; perfilar el resto |

La acción sobre la causa 2 es la de mejor retorno de todo el runbook: es configuración de URL, no código.

## Rollback

Si la degradación llegó con un despliegue concreto, revertir y medir de nuevo para confirmar la relación.

## Prevención

1. Script `check-bundle-budget.mjs` que compare cada build con [../../performance/budgets.md](../../performance/budgets.md) (propuesto, no implementado).
2. Panel de Web Vitals sobre los datos que **ya se están emitiendo** (`PERF-02`) — no requiere tocar el frontend.
3. Completar la comparación de bundle pre/post OpenTelemetry (`PERF-03`).

## Escalado

Si la causa es el backend, requiere a ese equipo. Sin contacto definido en el repositorio (`OPS-05`).

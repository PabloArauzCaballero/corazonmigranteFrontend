# 04 — Estrategia de Web Vitals (Fase 22)

## 1. La decisión de fondo

**Jaeger es un almacén de trazas, no una plataforma de métricas.** Web Vitals son
métricas: valores numéricos que solo tienen sentido agregados (percentil 75 sobre
miles de visitas). Meterlos en Jaeger y pretender analizarlos allí es usar la
herramienta equivocada.

Aun así, hay un motivo legítimo para que aparezcan en las trazas: **correlación**.
Cuando alguien reporta "la página va lenta", poder ver el LCP de *esa* sesión, en *esa*
ruta y con *esa* versión desplegada, vale más que un percentil global.

La decisión, por tanto, es un punto intermedio explícito:

> Se emite **un span por métrica**, con nombre fijo y tres atributos de baja
> cardinalidad. Sirve para correlacionar, no para analizar.

---

## 2. Qué se mide

| Métrica | Fuente | Cuándo se emite |
| --- | --- | --- |
| **FCP** | `PerformanceObserver("paint")` | En cuanto ocurre |
| **TTFB** | `PerformanceNavigationTiming.responseStart` | En cuanto ocurre |
| **INP** (aproximado) | `PerformanceObserver("event")` con `interactionId` | Al detectar una interacción más lenta que las anteriores |
| **LCP** | `PerformanceObserver("largest-contentful-paint")` | **Al ocultarse la página**: antes el valor no es definitivo |
| **CLS** | `PerformanceObserver("layout-shift")`, acumulado | **Al ocultarse la página** |

Implementación: [`src/observability/react/use-web-vitals.ts`](../../../src/observability/react/use-web-vitals.ts).

### INP: aproximación honesta

La definición oficial de INP usa un percentil sobre todas las interacciones de la
sesión. Aquí se emite **la interacción más lenta observada**, que es el caso peor.
Es lo que se diagnostica en la práctica, pero **no es INP en sentido estricto** y no
debe compararse con el INP que reporta CrUX o Lighthouse.

---

## 3. Dónde se almacena

```text
PerformanceObserver → span "ui.interaction" → Collector → Jaeger
```

Atributos del span:

```text
web_vital.name    = LCP | CLS | INP | FCP | TTFB     (5 valores)
web_vital.value   = 2410                              (número redondeado)
web_vital.rating  = good | needs-improvement | poor   (3 valores)
app.route.template= /admin/usuarios                   (≤ 58 valores)
```

Umbrales de `rating`: los oficiales de Google (2024), en `use-web-vitals.ts`.

---

## 4. Cómo se correlaciona

Todos los spans comparten el recurso del frontend, así que en Jaeger se puede filtrar
por:

- `service.version` y `app.build.id` → ¿empeoró con el último despliegue?
- `app.route.template` → ¿es una pantalla concreta?
- `deployment.environment.name` → ¿pasa solo en producción?
- `app.session.id` → todas las métricas de la misma visita, junto a sus errores y sus
  llamadas al backend.

Ese último punto es el valor real: ver el LCP **y** el `http.client` de 4 segundos
**y** el `client.error`, todo de la misma sesión, en una sola pantalla.

---

## 5. Qué NO se envía a Jaeger

| No se envía | Motivo |
| --- | --- |
| Un span por cada `layout-shift` | Una página puede generar decenas. Se acumulan en memoria y se emite **uno** al final. |
| Un span por cada `PerformanceEntry` | Volumen enorme, valor nulo. |
| `LargestContentfulPaint.element` | Es un **elemento del DOM**: identificaría contenido concreto de la pantalla. |
| `LayoutShiftAttribution.node` | Igual que el anterior. |
| Selectores CSS | Prohibido por la regla 18 y por el documento 05. |
| Decimales sin significado | Los milisegundos se redondean a entero; CLS a tres decimales. |
| Métricas con la página aún visible | LCP y CLS no son definitivos hasta que la página se oculta. |

---

## 6. Por qué NO se usa la librería `web-vitals`

`web-vitals` (~2 kB) implementa exactamente lo que hace `use-web-vitals.ts` con
`PerformanceObserver`, más una definición de INP más rigurosa. Se ha descartado porque:

1. El módulo de observabilidad ya añade ~7–8 kB de First Load con la telemetría
   apagada (ver `bundle-after.md`); sumar una dependencia más para una aproximación
   que ya sirve al objetivo de correlación no compensa.
2. Si en el futuro se quiere análisis agregado serio, la solución correcta **no** es
   esa librería sino la ruta de métricas de la sección 7.

Esta decisión debe revisarse si aparece el requisito de reportar Web Vitals con rigor
estadístico.

---

## 7. Ruta futura: métricas de verdad

Cuando haga falta análisis agregado (percentiles, series temporales, alertas), el
camino **no** es Jaeger:

```text
Navegador ──OTLP métricas──► Collector ──► Prometheus ──► Grafana
```

Requiere:

1. añadir `@opentelemetry/sdk-metrics` y un `MeterProvider` en el arranque,
2. un pipeline `metrics` en `otel-collector.frontend.yml`,
3. un `prometheusremotewrite` o `prometheus` exporter.

**Está documentado, no implementado.** Implementarlo ahora sería infraestructura sin
consumidor.

---

## 8. Impacto esperado

| Aspecto | Impacto |
| --- | --- |
| Spans por visita | 3 inmediatos (FCP, TTFB) + 2 al ocultar (LCP, CLS) + como mucho unos pocos INP |
| Bundle | 0 kB adicionales: `PerformanceObserver` es API del navegador |
| Rendimiento | Despreciable. Los observadores son pasivos y se desconectan al desmontar |
| Navegadores sin soporte | `observe()` va en `try/catch`: Firefox no soporta `layout-shift` ni `largest-contentful-paint` y simplemente no emite esas dos |
| Cardinalidad | 5 × 3 × 58 = 870 combinaciones como máximo |

# Presupuestos de rendimiento

- **Fecha de evidencia:** 2026-08-03
- **Base:** medición real de `yarn build` del 2026-08-03

> Los presupuestos de bundle se derivan de la línea base medida. Los de Core Web Vitals son **objetivos**, no mediciones: no hay medición de campo ni de laboratorio en el repositorio. Se marca cada fila con su naturaleza.

---

## 1. Presupuestos de JavaScript

| Métrica | Línea base | Presupuesto | Umbral de alerta | Naturaleza |
|---|---:|---:|---:|---|
| JS compartido por todas las rutas | 100 kB | **≤ 110 kB** | 105 kB | Medido |
| First Load JS de `/` | 194 kB | **≤ 210 kB** | 200 kB | Medido |
| First Load JS de cualquier ruta | máx. 194 kB | **≤ 220 kB** | 210 kB | Medido |
| Peso propio de una ruta | máx. 28,3 kB | **≤ 35 kB** | 30 kB | Medido |
| Número de rutas construidas | 69 | Informativo | — | Medido |

**Margen elegido: ~10 %.** Suficiente para absorber crecimiento normal, estrecho para que una dependencia pesada dispare la alerta.

**Regla de excepción:** superar un presupuesto no bloquea automáticamente. Exige justificación explícita en el PR y actualizar esta tabla con la nueva línea base. Un presupuesto que se sube en silencio no es un presupuesto.

---

## 2. Presupuestos de Core Web Vitals

⚠️ **Objetivos, no mediciones.** Se adoptan los umbrales «Bueno» de Google.

| Métrica | Objetivo | Necesita mejora | Deficiente | Estado actual |
|---|---:|---:|---:|---|
| LCP (Largest Contentful Paint) | ≤ 2,5 s | 2,5–4,0 s | > 4,0 s | **Sin medir** |
| INP (Interaction to Next Paint) | ≤ 200 ms | 200–500 ms | > 500 ms | **Sin medir** |
| CLS (Cumulative Layout Shift) | ≤ 0,1 | 0,1–0,25 | > 0,25 | **Sin medir** |
| FCP (First Contentful Paint) | ≤ 1,8 s | 1,8–3,0 s | > 3,0 s | **Sin medir** |
| TTFB | ≤ 800 ms | 800–1 800 ms | > 1 800 ms | **Sin medir** |

**Existe la instrumentación pero no el consumo.** [`use-web-vitals.ts`](../../src/observability/react/use-web-vitals.ts) recoge Web Vitals y los envía como trazas al colector. Lo que falta es el panel que los agregue y el umbral que dispare una alerta. Ver [monitoring.md](monitoring.md) y brecha `PERF-02`.

### Expectativa razonable por arquitectura

Con `output: "export"` sobre Cloudflare Pages, **TTFB y FCP deberían ser muy buenos**: el HTML es estático y viaja desde el borde, sin servidor de aplicación en el camino.

El riesgo se concentra en **LCP en `/`**, donde confluyen la ruta más pesada (194 kB), la imagen del hero y las dos familias tipográficas.

---

## 3. Presupuestos de recursos

| Recurso | Presupuesto | Estado |
|---|---|---|
| CSS inicial | ≤ 50 kB | Sin medir por separado — Tailwind purga por contenido |
| Imagen del hero | ≤ 200 kB | Sin medir. Servida por Cloudinary |
| Peso total de imágenes por página | ≤ 1 MB | Sin medir |
| Familias tipográficas | **2** (Fraunces, Manrope) | ✅ Cumplido |
| Archivos de fuente | ≤ 4 | ✅ Fuentes variables: un archivo por familia |
| Peticiones críticas de red | ≤ 15 | Sin medir |
| Scripts de terceros | **0** | ✅ Cumplido — y es un compromiso, no una casualidad |
| Tiempo de build | ≤ 3 min | ✅ ~60 s medidos |

El presupuesto de **cero scripts de terceros** es el más valioso de la tabla: sostiene la CSP, elimina una familia entera de riesgos de cadena de suministro y evita el patrón de degradación más común en aplicaciones web.

---

## 4. Qué NO se puede sacrificar para cumplir presupuestos

Regla explícita del plan maestro, recogida aquí como norma del proyecto:

| No se elimina | Motivo |
|---|---|
| Validación de formularios | Es corrección de datos, no adorno |
| Comprobaciones de accesibilidad (foco, `aria-live`) | Ver [../accessibility/audit-report.md](../accessibility/audit-report.md) |
| Saneado de telemetría | Es una salvaguarda de privacidad |
| Fronteras de error | Sin ellas un fallo se lleva la pantalla entera |
| El `ClientRoleGuard` | Es la única protección de la interfaz |

Optimizar quitando cualquiera de estas cinco cosas no es optimizar: es cambiar el producto por otro peor.

---

## 5. Verificación

Hoy, manual:

```bash
rm -rf .next out && yarn build   # comparar la tabla contra §1
```

**Propuesta** (`INSTRUMENTACIÓN SEGURA`, no implementada): `scripts/check-bundle-budget.mjs` que parsee la salida del build y compare contra esta tabla, en modo informativo. Ver [../governance/change-management.md](../governance/change-management.md).

---

## 6. Revisión de los presupuestos

Deben revisarse cuando: se añada una dependencia de producción significativa, se retire `output: "export"`, se incorpore i18n o modo oscuro, o exista medición de campo real que permita sustituir objetivos por datos.

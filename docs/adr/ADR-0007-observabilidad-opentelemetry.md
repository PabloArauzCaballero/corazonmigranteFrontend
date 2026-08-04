# ADR-0007: OpenTelemetry con saneado en dos capas

## Estado

**Aceptado** — incorporación reciente, en curso al 2026-08-03 (`src/observability/` sin seguimiento en git).

## Contexto

La aplicación trata **datos de salud de personas migrantes**. Cualquier observabilidad debía diagnosticar sin exponer a nadie. La documentación previa del equipo ([observability/frontend/00-current-state-audit.md](../observability/frontend/00-current-state-audit.md)) precede a esta decisión.

## Decisión

OpenTelemetry Web SDK con **28 archivos propios** en `src/observability/`, organizados en `browser/`, `config/`, `core/` y `react/`, y **saneado en dos capas independientes**.

## Consecuencias positivas

### El saneado en dos capas es lo más destacable

| Capa | Componente | Función |
|---|---|---|
| 1 — construcción | `tracing.attributes.ts` | `safeAttributes()` con `ALLOWED_ATTRIBUTE_KEYS` — **lista blanca** |
| 1 — construcción | `route-template.ts` | `/admin/users/8f2a…` → `/admin/users/:id` |
| 1 — construcción | `sanitize.ts` | `sanitizeErrorMessage()`, `FORBIDDEN_VALUE_PATTERNS` |
| 2 — exportación | `sanitizing-span-processor.ts` | Reexamina cada span **antes de salir** |

**Una lista blanca, no una lista negra.** Con lista negra, cada atributo nuevo es sensible por defecto hasta que alguien recuerda prohibirlo. Con lista blanca, es inerte hasta que alguien lo autoriza. Es la elección correcta para datos de salud.

Ambos módulos de la capa 1 tienen prueba unitaria propia.

### Otras

- Spans de negocio útiles: `auth.session_expired` distingue «se echó a la persona al login» de un `401` cualquiera.
- `retry_count` expone un coste oculto: peticiones que tardan el doble por el reintento de validación.
- Exportación al **mismo origen** (`/otel/v1/traces`): la CSP no necesita abrir `connect-src`.
- **Desactivable por completo** (`disabledTelemetryConfig()`): se puede descartar como causa durante un incidente.
- `rotateTelemetrySessionId()` en `logout()`: en un equipo compartido, la actividad no se mezcla entre personas.

## Consecuencias negativas

| Consecuencia | Detalle |
|---|---|
| **11 dependencias nuevas en producción** | El 41 % de la superficie de producción |
| Coste en bundle | **Medido y cerrado**: 0 kB de SDK en el First Load; +7–8 kB por ruta del módulo propio. Ver [bundle-after.md](../observability/frontend/bundle-after.md) |
| Requiere infraestructura propia | Collector + Jaeger, fuera del repositorio |
| Pages Function adicional | Único código fuera del navegador |
| **Jaeger no es plataforma de métricas** | Documentado por el equipo en [04-web-vitals-strategy.md](../observability/frontend/04-web-vitals-strategy.md). Es el bloqueo real de `PERF-02` |
| Capacidad forense reducida | El saneado que protege en el día a día limita la investigación de incidentes |
| Varias dependencias en `0.x` | `^0.221.0`, `^0.66.0`: una menor puede romper |

El compromiso privacidad/forense es correcto —proteger por defecto—, pero implica que investigar un incidente de acceso dependerá casi por completo del backend.

### La medición de bundle merece reconocimiento

Se fijó una cifra de control **antes** (`bundle-baseline.md`), se midió **después** (`bundle-after.md`), y las dos regresiones detectadas se corrigieron con su coste documentado: `zod` fuera del camino caliente (−18 kB) y `@opentelemetry/api` diferido (−3 kB).

Es exactamente el procedimiento que exige la política de cero regresiones, aplicado por iniciativa propia a una incorporación voluntaria.

## Riesgos

| Riesgo | Severidad |
|---|---|
| Alguien amplía `ALLOWED_ATTRIBUTE_KEYS` sin evaluar la privacidad | MEDIUM — mitigado: es un cambio explícito y revisable |
| Plataforma de métricas sin decidir; telemetría apagada (`PERF-02`) | MEDIUM — capacidad construida y no explotada |
| Pages Function sin autenticar acepta lotes OTLP | LOW — puede envenenarse la telemetría |
| ~~Coste en bundle sin medir~~ | ✅ **Cerrado** |

**`PERF-02` es el riesgo restante:** se ha pagado el coste (11 dependencias, infraestructura, complejidad) y aún no se cobra el beneficio, porque la bandera está apagada y Jaeger no sirve para agregar Web Vitals. Cerrarlo **no requiere tocar el frontend**: es una decisión de plataforma.

## Evidencia

- 28 archivos en [src/observability/](../../src/observability/)
- 11 paquetes `@opentelemetry/*` en `dependencies`
- [functions/otel/v1/traces.ts](../../functions/otel/v1/traces.ts) y [infra/otel-collector/](../../infra/otel-collector/)
- `tests/unit/observability/{sanitize,route-template}.test.ts`
- Documentación previa del equipo en [observability/frontend/](../observability/frontend/01-architecture-design.md)

## Plan de revisión

Revisar cuando: exista panel y alertas (cierra `PERF-02`), se complete la medición de bundle (`PERF-03`), o se planteen métricas y logs además de trazas.

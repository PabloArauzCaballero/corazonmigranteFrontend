# Captura y reporte de errores

- **Fecha de evidencia:** 2026-08-03

## 1. Estado

**No hay plataforma de error tracking** (Sentry, Rollbar, Bugsnag). Los errores viajan como **spans OpenTelemetry** hacia el colector.

| Capacidad | Estado |
|---|---|
| Captura de excepciones de React | ✅ `react-error-reporter.ts`, `telemetry-boundary.tsx` |
| Reporte manual | ✅ `report-error.ts` |
| Errores de red | ✅ Atributo de estado en el span `http.client` |
| Contexto de release | ✅ `shortBuildId()` y `defaultEnvironment()` |
| Saneado del mensaje | ✅ `sanitizeErrorMessage()` + `SanitizingSpanProcessor` |
| **Agrupación por huella** | ❌ No |
| **Alertado** | ❌ No |
| **Tendencias y regresiones** | ❌ No |
| **Stack traces con source maps** | ❌ No |
| Errores globales no capturados | ✅ `browser-errors.ts` |

## 2. Cómo se reporta un error

```
Excepción en React
  → error.tsx del segmento (o telemetry-boundary)
  → report-error.ts
  → span con estado de error
  → sanitizeErrorMessage()
  → SanitizingSpanProcessor (segunda capa)
  → exportador OTLP → /otel/v1/traces → colector
```

Las fronteras disponibles están en [../architecture/error-boundaries.md](../architecture/error-boundaries.md): cinco `error.tsx` por segmento más dos componentes reutilizables.

## 3. Qué llega y qué no

| Llega | No llega |
|---|---|
| Mensaje **saneado** | Mensaje original si contenía datos sensibles |
| Plantilla de ruta (`/admin/users/:id`) | URL concreta |
| Entorno y build id | Identidad de la persona usuaria |
| Segmento de usuario (categoría del rol) | Rol exacto |
| Código de estado en errores HTTP | Cuerpo de petición o respuesta |
| Id de sesión de telemetría (aleatorio, rotado) | Nada que lo vincule a `userId` |

## 4. El compromiso, explícito

El saneado es correcto para una aplicación que trata datos de salud. Pero tiene una consecuencia que conviene tener clara **antes** de necesitarla:

> Ante un incidente, no se puede responder «¿a qué personas usuarias afectó?» ni «¿qué estaba haciendo exactamente?».

Se sabe **qué falló, dónde y con qué frecuencia**. No **a quién**.

Es la decisión correcta —proteger por defecto—, y significa que la investigación de un incidente de acceso dependerá casi por completo de los logs del backend. Ver [../security/incident-response.md §4](../security/incident-response.md).

## 5. Lo que falta

| Carencia | Impacto |
|---|---|
| Sin agrupación por huella | Un mismo error mil veces son mil spans sueltos |
| Sin alertado | Nadie se entera de un pico de errores |
| Sin source maps | El stack apunta a código minificado |
| Sin tendencias | No se detecta una regresión al desplegar |

**Sobre los source maps:** `productionBrowserSourceMaps` no está declarado en `next.config.ts`, y Next.js **no** los emite por defecto. Es correcto para no exponer el código, pero implica que un stack trace de producción es prácticamente ilegible. Con una plataforma de error tracking se resolvería subiendo los mapas de forma privada.

Registrado como `OBS-01`, severidad MEDIUM.

## 6. Errores absorbidos deliberadamente

No todos los errores se reportan, y con razón:

| Situación | Comportamiento | Justificación en el código |
|---|---|---|
| Falla `/api/debug-log` | Se ignora | «el logging nunca debe romper la app» |
| Falla el contador de no leídas | Muestra `0` | «El badge no es crítico» |
| Mensaje SSE malformado | Se descarta | `catch { /* malformed event — ignore */ }` |
| `localStorage` corrupto | Devuelve `null` | `try/catch` sobre `JSON.parse` |
| Falla la telemetría | Inerte | La aplicación funciona sin observabilidad |

Que la telemetría no pueda romper la aplicación es una propiedad importante: permite descartarla como causa durante un incidente.

## 7. Propuesta

Antes de incorporar una plataforma de error tracking, la acción de mayor valor es **construir el panel sobre los datos que ya se emiten** (`PERF-02`), que no requiere tocar el frontend ni añadir dependencias. Con eso se cubre alertado y tendencias; la agrupación por huella y los source maps son el siguiente escalón.

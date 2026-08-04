# Registro de decisiones de arquitectura (ADR)

- **Fecha de evidencia:** 2026-08-03

> **Nota metodológica.** Estos ADR se escriben **a posteriori**. El repositorio no conserva registro de las deliberaciones originales, así que cada uno documenta la decisión **tal como está implementada** y sus consecuencias verificables. No se inventan razonamientos históricos. Donde el código comenta el porqué, se cita textualmente; donde no, se dice que se documenta el estado observado.

## Índice

| ADR | Título | Estado | Impacto |
|---|---|---|---|
| [0001](ADR-0001-nextjs-app-router.md) | Next.js 15 con App Router | Aceptado | Máximo |
| [0002](ADR-0002-exportacion-estatica.md) | Exportación estática (`output: "export"`) | Aceptado | **Máximo — condiciona todo lo demás** |
| [0003](ADR-0003-proteccion-cliente.md) | Protección de rutas en el cliente | Aceptado | Alto |
| [0004](ADR-0004-estado-servidor-react-query.md) | React Query para el estado de servidor | Aceptado | Alto |
| [0005](ADR-0005-arquitectura-por-features.md) | Organización por features | Aceptado | Alto |
| [0006](ADR-0006-tailwind-radix.md) | Tailwind + Radix como sistema de diseño | Aceptado | Medio |
| [0007](ADR-0007-observabilidad-opentelemetry.md) | OpenTelemetry con saneado en dos capas | Aceptado | Medio |
| [0008](ADR-0008-lint-bloquea-build.md) | El lint bloquea el build | Aceptado | Medio |
| [0009](ADR-0009-tipos-manuales-sin-openapi.md) | Tipos manuales sin OpenAPI | Aceptado por omisión | Alto |
| [0010](ADR-0010-sin-i18n.md) | Sin internacionalización | Aceptado por omisión | Medio |
| [0011](ADR-0011-tokens-y-paletas-remapeadas.md) | Paletas de Tailwind redirigidas a variables CSS | Aceptada | Alto |
| [0012](ADR-0012-turbopack-solo-en-desarrollo.md) | Turbopack en desarrollo, webpack en el build | Aceptada | Medio |

## Cómo leer estos ADR

**ADR-0002 es la decisión raíz.** La exportación estática determina que no haya middleware activo (→ ADR-0003), que las cabeceras vivan en `_headers`, que el JWT esté en `localStorage` y que el contenido CMS requiera reconstruir. Casi todas las peculiaridades del proyecto se derivan de ahí.

Los ADR marcados «Aceptado por omisión» documentan situaciones donde **no consta una decisión deliberada**: simplemente no se incorporó la capacidad. Se registran porque su ausencia tiene consecuencias igual que las tendría una decisión explícita.

## Plantilla

```markdown
# ADR-XXXX: Título

## Estado
Propuesto | Aceptado | Reemplazado | Rechazado | Obsoleto

## Contexto
## Fuerzas y restricciones
## Opciones consideradas
## Decisión
## Consecuencias positivas
## Consecuencias negativas
## Riesgos
## Evidencia
## Plan de revisión
```

## Cuándo escribir un ADR nuevo

Ante cualquier decisión que: cambie el modelo de renderizado o despliegue, introduzca o retire una dependencia estructural, altere el modelo de autenticación o autorización, modifique la organización de capas, o establezca un patrón que otros deban seguir.

Un ADR no documenta *qué* se hizo —eso está en el código— sino **por qué**, qué se descartó y qué se acepta a cambio.

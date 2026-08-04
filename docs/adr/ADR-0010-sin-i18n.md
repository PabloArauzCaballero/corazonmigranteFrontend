# ADR-0010: Sin internacionalización

## Estado

**Aceptado por omisión** — no consta una decisión deliberada. Se documenta el estado observado el 2026-08-03.

## Contexto

Corazón Migrante atiende a **personas migrantes**. Es, por definición, una población con diversidad lingüística: personas cuya lengua materna puede no ser el español, o que llegan desde contextos con otras variantes del idioma.

**No existe internacionalización.** Sin `next-intl`, `react-i18next` ni `next/navigation` con `i18n`. Todos los textos están incrustados en los componentes y `<html lang="es">` es fijo.

## Situación verificada

| Elemento | Estado |
|---|---|
| Librería i18n | ❌ Ninguna en `package.json` |
| Archivos de traducción | ❌ Ninguno |
| `lang` del documento | `"es"` fijo en `app/layout.tsx` |
| Rutas por idioma | ❌ No existen |
| Textos | Incrustados en componentes |
| Formato de fechas | `date-fns` sin localización configurada |
| Metadatos | `locale: "es_ES"` fijo en Open Graph |

## Consecuencias positivas

- Simplicidad: sin capa de traducción, sin claves que mantener, sin desincronización entre idiomas.
- Menos peso en el bundle.
- Los textos se leen en el código, junto a la interfaz que describen.
- Sin riesgo de mostrar una clave sin traducir.

## Consecuencias negativas

- **La aplicación solo es utilizable en español.** Para su población objetivo, es una limitación de accesibilidad real, no teórica.
- Incorporar i18n más adelante exigirá **extraer cada cadena de cada componente**: es un cambio transversal a las 69 rutas y los 17 dominios.
- Los formatos de fecha y número no se adaptan a la convención local de quien usa la aplicación.

Sobre la primera: WCAG no exige multilingüismo, así que no es un incumplimiento formal. Pero para un servicio de acompañamiento emocional dirigido a personas migrantes, la barrera idiomática afecta directamente a quién puede pedir ayuda. Es una limitación de **producto**, más que técnica.

## Riesgos

| Riesgo | Severidad |
|---|---|
| Exclusión de personas usuarias no hispanohablantes | **Depende del alcance del proyecto** |
| El coste de incorporar i18n crece con cada pantalla nueva | MEDIUM y creciente |
| Textos duplicados entre componentes dificultarían una extracción posterior | LOW |

El segundo riesgo es el argumento operativo más fuerte: **cuanto más tarde se decida, más caro será**. Cada ruta y cada componente nuevo añade cadenas que habría que extraer.

## Lo que sí está bien resuelto

- `<html lang="es">` declarado correctamente (WCAG 3.1.1 ✅). Una aplicación monolingüe con el `lang` correcto es accesible para lectores de pantalla en ese idioma.
- Los textos están en español claro y explicativo. Las descripciones de `/admin/contabilidad` explican qué es una cuenta o un centro de costo en lenguaje llano, no con jerga contable.
- `ForbiddenState` y los estados de error usan mensajes comprensibles, no códigos.

Ese cuidado en la redacción indica atención al perfil de quien usa la aplicación — lo que hace la ausencia de i18n más llamativa, no menos.

## Evidencia

- `package.json` — sin dependencia de i18n
- [app/layout.tsx](../../src/app/layout.tsx) — `lang="es"`, `locale: "es_ES"`
- Textos incrustados en todos los componentes revisados

## Plan de revisión

**Esta decisión debería revisarse explícitamente**, no seguir siendo una omisión.

La pregunta a responder no es técnica sino de producto: **¿el proyecto atiende solo a población hispanohablante?** Si la respuesta es sí, conviene registrarlo como decisión consciente. Si es no, o es «no del todo», el coste de la incorporación crece con cada entrega.

Registrado en [reports/frontend-inventory.md §8](../reports/frontend-inventory.md) como capacidad ausente.

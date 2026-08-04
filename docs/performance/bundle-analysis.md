# Análisis de bundle

- **Fecha de evidencia:** 2026-08-03
- **Fuente:** salida real de `yarn build` (Next.js 15.4.7)

> **No hay `@next/bundle-analyzer` instalado.** Estas cifras son las que reporta `next build`, no un desglose por módulo. Registrado como brecha `PERF-01`.

---

## 1. JavaScript compartido

| Chunk | Tamaño |
|---|---:|
| `chunks/4bd1b696-*.js` | 54,1 kB |
| `chunks/5964-*.js` | 44 kB |
| Otros chunks compartidos | 2,23 kB |
| **Total en todas las rutas** | **100 kB** |

100 kB de base es razonable para React 19 + Next 15 + React Query + providers. Es el suelo: ninguna ruta puede bajar de ahí.

## 2. Rutas por First Load JS

### Las diez más pesadas

| Ruta | Propio | First Load | Comentario |
|---|---:|---:|---|
| `/` | 28,3 kB | **194 kB** | La landing: la puerta de entrada y la más pesada |
| `/admin/contenido/*` (6 rutas) | 162 B | **186 kB** | Todas comparten el chunk de `newsroom-admin` |
| `/admin/publicidad/{campanas,creativos,empresas}` | 162 B | **186 kB** | Igual |
| `/booking`, `/paciente/booking`, `/terapeuta/booking`, `/admin/booking` | ~200 B | **179 kB** | Chunk común de reserva |
| `/[slug]`, `/biblioteca`, `/cursos` | ~200 B | **177 kB** | Chunk de `EditorialPublicPage` |
| `/registro` | 5,42 kB | 175 kB | Formulario con catálogos remotos |
| `/admin/solicitudes` | 8,78 kB | 173 kB | — |
| `/admin/contenido/editorial` | 6,6 kB | 172 kB | — |
| `/admin/usuarios` | **17,3 kB** | 170 kB | El segundo mayor peso propio |
| `/*/ayuda` (3 rutas) | ~146 B | 169 kB | Chunk de `TutorialCenter` |

### Las más ligeras

| Ruta | First Load |
|---|---:|
| `/_not-found`, `/privacidad`, `/terminos`, `/admin/publicidad`, `/robots.txt`, `/sitemap.xml` | 101 kB |
| `/403`, `/admin/contabilidad` | 104 kB |
| `/paciente`, `/terapeuta` | 118 kB |

## 3. Lecturas del reparto

**a) El patrón «162 B propio / 186 kB total» es el más significativo.** Nueve rutas de administración pesan casi nada por sí mismas pero arrastran 86 kB por encima de la base compartida. Todas renderizan un componente de `newsroom-admin`, que es una comunidad amplia en el grafo. El código está bien factorizado —el chunk se comparte, no se duplica—, pero **quien entra a `/admin/contenido/tags` descarga la maquinaria de todo el módulo de newsroom**.

**b) La landing es la ruta más pesada y la más visitada.** 194 kB con 28,3 kB propios. Es la primera impresión del producto para una persona que quizá esté en una conexión limitada. Es la ruta con mayor retorno potencial de cualquier optimización.

**c) `/paciente` y `/terapeuta` son notablemente ligeras** (118 kB) frente a `/admin` (167 kB). Los portales de las personas usuarias finales son más ligeros que el de administración, que es exactamente el reparto deseable.

**d) La división por rutas funciona.** El delta entre la ruta más ligera (101 kB) y la más pesada (194 kB) es de 93 kB: no se está cargando toda la aplicación en cada página.

## 4. Contribuyentes conocidos

| Dependencia | Impacto estimado | Notas |
|---|---|---|
| React 19 + React DOM | Mayor parte de los 100 kB base | Irreducible |
| `@tanstack/react-query` | Alto, en la base | Se usa en casi todas las rutas |
| `@opentelemetry/*` (11 paquetes) | **No cuantificado** | Ver §5 |
| `lucide-react` | Bajo si el *tree-shaking* funciona | Importaciones nombradas por icono |
| `date-fns` | Bajo | Modular |
| `@radix-ui/*` | Medio, en rutas con modal o tabs | — |
| `zod` | Medio, en la base | Se importa desde `config/env.ts`, que carga siempre |

## 5. El coste de OpenTelemetry — medido y cerrado

El equipo completó la comparación en [observability/frontend/bundle-after.md](../observability/frontend/bundle-after.md), contra la línea previa de [bundle-baseline.md](../observability/frontend/bundle-baseline.md).

| Criterio | Resultado |
|---|---|
| First Load compartido con la telemetría apagada | **100 kB → 100 kB** (sin cambio) |
| SDK en el First Load de alguna ruta | **0 kB** — vive en un chunk aparte de ~104 kB, diferido tras la hidratación |
| Con la bandera apagada, ¿existe el SDK en el artefacto? | **No** — verificado con `grep -l opentelemetry .next/static/chunks/*.js` (sin resultados) |
| Coste del módulo propio `src/observability/` | **+7–8 kB por ruta**, medido y justificado |

El `+7–8 kB` **no es OpenTelemetry**: es el módulo propio, que sí se ejecuta siempre porque lo importan `AppProviders`, `apiRequest()` y los cinco `error.tsx`.

Con la bandera apagada, la condición de `src/instrumentation-client.ts` se resuelve en tiempo de build (`"false" === "true"`) y el empaquetador **elimina el `import()` entero**.

### Dos optimizaciones que hicieron falta

La primera medición dio **+11 a +28 kB**. Se corrigieron dos causas concretas:

1. **`zod` fuera del camino caliente** (−18 kB en rutas de portal). `telemetry.schema.ts` validaba con zod y lo arrastraba hasta rutas que no lo incluían: `/paciente` pasó de 111 a 139 kB. Se reescribió la validación a mano —nueve cadenas— con las mismas garantías, cubiertas por `telemetry-config.test.ts`. `/paciente`: 139 → 121 kB.
2. **`@opentelemetry/api` diferido** (−3 kB en todas las rutas). Se introdujo `core/otel-api.ts`: mientras no se inicializa, la API responde con un span inerte local (`NOOP_SPAN`) sin importar nada. `/paciente`: 121 → **118 kB**.

**Brecha `PERF-03`: CERRADA.** Es un ejemplo de medición bien hecha — se fijó una cifra de control antes, se midió después, y las dos regresiones detectadas se corrigieron con su coste documentado.

## 6. Cómo reproducir

```bash
rm -rf .next out     # imprescindible: una caché parcial produce cifras erróneas
yarn build           # la tabla de rutas se imprime al final
```

⚠️ No ejecutar dos builds en paralelo: compiten por `.next/` y fallan con `ENOENT` sobre los manifiestos. Ver [../operations/runbooks/build-manifest-enoent.md](../operations/runbooks/build-manifest-enoent.md).

## 7. Propuesta de instrumentación

`INSTRUMENTACIÓN SEGURA` — no implementada:

1. `@next/bundle-analyzer` tras una bandera de entorno, para no alterar el build normal.
2. Script `check-bundle-budget.mjs` que compare la salida del build contra [budgets.md](budgets.md) y avise (sin bloquear) al superarse.

La segunda es la de mayor valor: hoy **nada detecta** que una dependencia nueva añada 40 kB a todas las rutas.

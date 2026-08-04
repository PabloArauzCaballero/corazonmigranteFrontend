# ADR-0005: Organización por features

## Estado

**Aceptado** — estado observado el 2026-08-03.

## Contexto

La aplicación cubre dominios muy distintos: terapia, contabilidad, contenido editorial, publicidad, archivos, tutoriales. Hacía falta una organización que permitiera trabajar en uno sin conocer los demás.

## Decisión

Tres capas: **`app/` (rutas) → `features/` (17 dominios) → `shared/` (transversal)**, con un módulo `observability/` aparte.

Cada feature agrupa su interfaz y su cliente API:

```
src/features/<dominio>/
├── <dominio>.api.ts
├── <dominio>.types.ts
├── <componente>.tsx
└── use-<algo>.ts
```

**No se usa atomic design.** No hay `atoms/`, `molecules/` ni `organisms/`, y la documentación no los presupone.

## Opciones consideradas

| Opción | Descartada porque |
|---|---|
| **Por features** (elegida) | — |
| Por tipo técnico (`components/`, `hooks/`, `services/`) | Un cambio de dominio obliga a tocar cuatro carpetas |
| Atomic design | Clasifica por forma visual, no por dominio; en una aplicación con esta variedad de negocio aporta poco |
| Monorepo con paquetes | Sobredimensionado para un frontend único |

## Consecuencias positivas

- **Cero ciclos entre capas**: la dirección `app → features → shared` se respeta en 6 783 aristas. (Existe un ciclo *interno* al barril de `observability`, ajeno a esta decisión: ver `ARCH-01`.)
- Un dominio se entiende leyendo una sola carpeta.
- `src/app/` queda deliberadamente delgada: la mayoría de `page.tsx` solo componen.
- Permite documentar el producto **por feature**, no por ruta.

La ausencia total de ciclos en una base de este tamaño es el indicador más sólido de que la organización se está respetando en la práctica y no solo en la intención.

## Consecuencias negativas

- Hay **cruces entre features**: `public-content` + `public-view` en dos páginas admin; `profile` usa `users.api.ts`. Son legítimos, pero difuminan el límite.
- Una feature puede crecer sin control: `newsroom` cubre publicaciones, taxonomía, suscriptores, publicidad y premium.
- El módulo `tutorial` **rompe la convención** y se organiza por responsabilidad interna (`model/`, `engine/`, `registry/`, `storage/`, `ui/`, `catalog/`, `analytics/`).

Sobre la última: no es una infracción, es una adaptación acertada. `tutorial` es un motor, no un CRUD, y esa separación interna es lo que hace posibles sus **10 suites de prueba** — el 45 % de toda la cobertura del proyecto.

## Riesgos

| Riesgo | Severidad |
|---|---|
| `newsroom` y `editorial` crecen hasta ser inmanejables | MEDIUM — comunidades de baja cohesión en Graphify (0,06–0,09) |
| Los cruces entre features se normalizan y se pierde el límite | LOW |
| Lógica de negocio filtrándose a `app/` | LOW — ya ocurre en `admin/notificaciones/page.tsx` |

Las cifras de cohesión baja son **señales para revisión, no deuda confirmada**: las calcula un algoritmo sobre el grafo y agrupa nodos que el código mantiene en archivos separados.

## Evidencia

- 17 carpetas en `src/features/`
- Graphify: `## Import Cycles — None detected`
- [architecture/module-dependencies.md](../architecture/module-dependencies.md)
- La estructura de siete subcarpetas de `src/features/tutorial/`

## Plan de revisión

Revisar si `newsroom` o `editorial` superan un tamaño que impida entenderlas de una vez, o si los cruces entre features se multiplican.

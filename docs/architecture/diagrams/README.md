# Diagramas de arquitectura

- **Fecha de evidencia:** 2026-08-03

## Fuentes

| Fuente | Uso |
|---|---|
| [structurizr/workspace.dsl](../../../structurizr/workspace.dsl) | **Fuente oficial** del modelo C4 (contexto, contenedores, componentes) |
| Bloques Mermaid en los documentos | Secuencias y flujos, junto al texto que explican |

Los diagramas Mermaid viven **dentro** del documento que explican, no en archivos sueltos: un diagrama separado de su explicación se desactualiza sin que nadie lo note.

## Índice de diagramas

| # | Diagrama | Tipo | Dónde |
|---|---|---|---|
| 1 | Contexto del sistema | C4 nivel 1 | [system-context.md](../system-context.md) · `workspace.dsl` |
| 2 | Contenedores | C4 nivel 2 | [containers.md](../containers.md) · `workspace.dsl` |
| 3 | Componentes de la aplicación | C4 nivel 3 | `workspace.dsl` (vista `Componentes`) |
| 4 | Flujo de navegación y rutas | Árbol | [routing-and-navigation.md](../routing-and-navigation.md) |
| 5 | Flujo de autenticación | Flowchart | [overview.md §6](../overview.md) |
| 6 | Flujo de datos navegador ↔ backend | Sequence | [overview.md §4](../overview.md) · [data-flow.md](../data-flow.md) |
| 7 | Manejo de errores | Flowchart | [error-boundaries.md](../error-boundaries.md) |
| 8 | Despliegue y entrega de assets | Flowchart | [../../operations/deployment.md](../../operations/deployment.md) |
| 9 | Fronteras de confianza | Flowchart | [system-context.md §4](../system-context.md) |
| 10 | Dependencias entre capas | Flowchart | [module-dependencies.md](../module-dependencies.md) |
| 11 | Ciclo de vida en el navegador | Sequence | [rendering-strategy.md §4](../rendering-strategy.md) |
| 12 | Subida a Cloudinary | Sequence | [integration-map.md §5](../integration-map.md) |
| 13 | Flujo SSE de notificaciones | Sequence | [data-flow.md §9](../data-flow.md) |

## Renderizar el modelo C4

```bash
docker run -it --rm -p 8080:8080 \
  -v "$(pwd)/structurizr:/usr/local/structurizr" \
  structurizr/lite
# → http://localhost:8080
```

Structurizr **no es dependencia del proyecto** y no participa en el build de la aplicación. El archivo `.dsl` es texto plano y se versiona junto al código.

## Regla de mantenimiento

Un cambio en rutas, capas, integraciones o límites de confianza obliga a actualizar `workspace.dsl` **y** el diagrama Mermaid correspondiente. Ver [../../governance/change-management.md](../../governance/change-management.md).

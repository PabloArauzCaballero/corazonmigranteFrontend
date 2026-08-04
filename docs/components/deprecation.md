# Deprecación y estado de los componentes

- **Fecha de evidencia:** 2026-08-03

## 1. Estado de los 19 componentes compartidos

| Componente | Estado | Nota |
|---|---|---|
| `button.tsx` | 🟢 Activo | Primitiva de acción, 52 aristas |
| `card.tsx` | 🟢 Activo | 37 + 37 aristas |
| `page-header.tsx` | 🟢 Activo | 42 aristas; fuente del `<h1>` |
| `state.tsx` | 🟢 Activo | Los cuatro estados de interfaz |
| `data-table.tsx` | 🟢 Activo | + `DataTableSkeleton` |
| `modal.tsx` | 🟢 Activo | Accesibilidad ejemplar |
| `toast.tsx` | 🟢 Activo | `ToastProvider` + `useToast()` |
| `confirm-dialog.tsx` | 🟢 Activo | `ConfirmProvider` |
| `smart-image.tsx` | 🟢 Activo | Único con prueba |
| `badge.tsx` | 🟢 Activo | Puramente visual |
| `input.tsx`, `textarea.tsx`, `label.tsx`, `password-input.tsx` | 🟢 Activos | — |
| `table-shell.tsx` | 🟢 Activo | Marco con desplazamiento |
| `auth-visual-layout.tsx` | 🟢 Activo | Login y registro |
| `error-boundary.tsx` | 🟢 Activo | Frontera de componente |
| `global-loading-bar.tsx` | 🟢 Activo | Montado en `AppProviders` |
| **`fontawesome.tsx`** | 🟡 **Revisar** | Ver §2 |

**Ningún componente está marcado como obsoleto o legado.** El sistema de diseño es reciente y coherente.

## 2. El caso de `fontawesome.tsx`

El sistema usa `lucide-react` de forma predominante: `state.tsx`, `button.tsx`, `data-table.tsx`, `toast.tsx`, navegación y páginas índice.

`fontawesome.tsx` convive con él como segunda familia de iconos.

| Consecuencia | Detalle |
|---|---|
| Peso | Dos familias en el bundle |
| Inconsistencia visual | Trazos, grosores y rejillas distintos |
| Ambigüedad para quien desarrolla | ¿Cuál usar en un componente nuevo? |

**No se propone eliminarlo aquí**: sería `CAMBIO DE PRODUCTO` y requiere revisar cada uso. Registrado como `PERF-05`, severidad LOW.

**Regla mientras tanto: usar `lucide-react` en todo componente nuevo.**

## 3. Componentes eliminados recientemente

Detectado en el estado de git al iniciar este plan:

| Archivo | Estado |
|---|---|
| `src/features/tutorial/guided-tour.tsx` | Eliminado |
| `src/features/tutorial/portal-tours.ts` | Eliminado |
| `src/features/tutorial/tutorial-launcher.tsx` | Eliminado |

Sustituidos por la estructura modular de siete subcarpetas (`model/`, `catalog/`, `engine/`, `registry/`, `storage/`, `analytics/`, `ui/`).

Es una **deprecación bien ejecutada**: se reemplazó una implementación monolítica por una modular, con 10 suites de prueba que respaldan la nueva. Es el mejor ejemplo del proyecto de cómo retirar código.

## 4. Proceso de deprecación propuesto

No existe uno formal. Propuesta:

| Fase | Acción |
|---|---|
| 1. Marcar | Comentario `@deprecated` con la alternativa y la fecha |
| 2. Documentar | Cambiar el estado a 🟡 en la tabla del §1 |
| 3. Migrar | Sustituir los usos, uno a uno, con verificación |
| 4. Verificar | Búsqueda global sin resultados |
| 5. Eliminar | Borrar el archivo y actualizar esta tabla |

Con TypeScript, `@deprecated` produce tachado en el editor: es la forma más barata de que un componente en retirada deje de usarse en código nuevo.

## 5. Sobre Storybook

**No existe.** Este catálogo documental es la única referencia de los componentes compartidos.

Incorporarlo sería `CAMBIO DE PRODUCTO` (dependencias nuevas, configuración de build) y **no se propone aquí**. Si alguna vez se plantea:

- Las historias no deben depender de datos productivos ni de secretos.
- Debe construirse **aparte del bundle productivo**.
- Su valor real sería documentar variantes y estados de `Button`, `Badge`, `state.tsx` y `DataTable` — y, sobre todo, servir de banco de pruebas de accesibilidad para `Modal`.

Antes que Storybook, la inversión de mayor retorno es la de [../testing/component-tests.md](../testing/component-tests.md): pruebas de componente sobre `Modal`, `Button`, `DataTable` y `toast`. Documentan el comportamiento **y** lo protegen; un catálogo visual solo lo documenta.

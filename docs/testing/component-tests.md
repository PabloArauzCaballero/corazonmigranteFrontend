# Pruebas de componentes

- **Fecha de evidencia:** 2026-08-03
- **Herramientas:** `@testing-library/react` 16.3, `@testing-library/user-event` 14.6, `@testing-library/jest-dom` 6.9, `jest-environment-jsdom`

## 1. Estado

| Componente | Aristas | Prueba | Cubre |
|---|---:|:--:|---|
| **`Modal`** | — | ✅ `ui-modal.test.tsx` (9) | Foco inicial, trampa en ambos sentidos, restauración, `Escape`, `aria-labelledby`/`describedby`, `aria-modal` |
| **`Button`** | 52 | ✅ `ui-button.test.tsx` (8) | `loading`→`disabled`, `aria-busy` ausente si no aplica, bloqueo de doble envío, `asChild`, spinner oculto |
| **`DataTable`** | — | ✅ `ui-data-table.test.tsx` (8) | Filas, cabeceras, defensa ante `undefined`/`null`, estado vacío, `getRowKey` |
| **`toast`** | — | ✅ `ui-toast.test.tsx` (8) | `role`/`aria-live` por urgencia, auto-cierre, **pausa al enfocar o pasar el puntero** |
| `SmartImage` | — | ✅ `smart-image.test.tsx` | Validación de origen, fallback |
| `PageHeader` | 42 | ❌ | Genera el `<h1>` de cada pantalla |
| `Card` / `CardContent` | 37 / 37 | ❌ | Riesgo bajo |
| `state.tsx` | — | ❌ | Riesgo bajo |
| `confirm-dialog` | — | ❌ | **Riesgo alto** — ver §2 |
| `Badge` | — | ❌ | Riesgo bajo |

**De 18 componentes sin prueba se pasó a 14**, y los cuatro cubiertos son los de mayor centralidad y mayor riesgo de accesibilidad. Brecha `TEST-02`: **cerrada en lo crítico**, abierta en el resto.

### Una lección de la implementación

Las primeras versiones de las pruebas de `Modal` **pasaban sin comprobar nada**. El componente filtra los enfocables por `offsetParent !== null` para descartar los ocultos, y **jsdom no calcula layout: devuelve `null` siempre**. El filtro eliminaba todos los controles y la trampa de foco nunca se ejercitaba.

La suite simula `offsetParent` para que jsdom reporte los elementos como visibles. Sin ese ajuste, una prueba en verde habría dado una falsa sensación de seguridad — que es peor que no tenerla.

## 2. Lo que sigue abierto: `confirm-dialog`

Se comporta como un diálogo modal y **no se ha verificado** que replique la trampa y restauración de foco de `Modal`. Se usa en las confirmaciones de borrado de las tablas de administración, así que es de uso frecuente.

Es hoy el mayor riesgo de accesibilidad sin cubrir. La forma más segura de cerrarlo sería que `confirm-dialog` reutilizara `Modal` en vez de mantener su propio contenedor superpuesto — pero eso es una refactorización, no una prueba.

## 3. Por qué `Modal` es el caso más grave

Concentra la lógica más delicada del sistema:

- Guarda `document.activeElement` y lo restaura al cerrar.
- Confina `Tab` y `Shift+Tab` dentro del panel.
- Filtra enfocables por `offsetParent !== null`, con excepción para el elemento activo.
- Cierra con `Escape`.
- Etiqueta con `useId()`.

Todo ello está **correcto hoy** y **nada impide que una refactorización lo rompa**. Un fallo aquí no produce un error visible: produce que alguien que navega con teclado quede atrapado o pierda su posición. Es exactamente el tipo de regresión que nadie reporta y que hace la aplicación inutilizable para quien depende de ello.

## 4. Lo que queda por cubrir

| # | Componente | Motivo |
|---:|---|---|
| 1 | `confirm-dialog` | Diálogo modal con gestión de foco sin verificar (§2) |
| 2 | `PageHeader` | Garantiza el `<h1>` de cada pantalla |
| 3 | `state.tsx` | Los cuatro estados de interfaz |
| 4 | `password-input` | El botón de alternar visibilidad debe ser enfocable, tener nombre accesible y `type="button"` |

El 4 es pequeño y tiene un fallo clásico asociado: un `<button>` sin `type="button"` dentro de un `<form>` **envía el formulario** al pulsarlo.

## 5. Complemento con `jest-axe`

Añadir `jest-axe` sobre estos mismos componentes detectaría automáticamente los fallos de contraste de las combinaciones listadas en [../accessibility/color-and-contrast.md §3](../accessibility/color-and-contrast.md), ya que todas se materializan en componentes compartidos.

Cierra parcialmente `A11Y-01` y `A11Y-02` a la vez, con coste bajo: Jest y Testing Library ya están instalados.

## 6. Convenciones

| Convención | Regla |
|---|---|
| Consulta | Por rol y nombre accesible (`getByRole`), no por clase ni test-id |
| Interacción | `user-event`, no `fireEvent` |
| Aserciones | `@testing-library/jest-dom` (`toBeDisabled`, `toHaveFocus`, …) |
| Red | Prohibida; simular el módulo `*.api.ts` |
| Ubicación | `tests/unit/`, extensión `.tsx` |

Consultar por rol tiene un efecto secundario valioso: **si un componente no es consultable por rol, probablemente tampoco sea accesible**. La prueba obliga a la semántica correcta.

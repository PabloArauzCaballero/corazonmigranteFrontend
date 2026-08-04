# Navegación por teclado

- **Fecha de evidencia:** 2026-08-03

## 1. Mecanismos globales

| Mecanismo | Implementación | Estado |
|---|---|---|
| Enlace de salto | `.skip-link` en `app/layout.tsx`, primer elemento del `<body>` | ✅ Verificado |
| Destino del salto | `<main id="contenido-principal" tabIndex={-1}>` en ambos shells | ✅ Verificado |
| Foco visible | `.focus-ring` + regla global `:focus-visible` en `globals.css` | ✅ Verificado |
| Cierre con `Escape` | `Modal` | ✅ Verificado |
| Trampa de foco | `Modal` (`Tab` y `Shift+Tab` circulan) | ✅ Verificado |

El `tabIndex={-1}` en `<main>` es lo que hace que el skip-link funcione de verdad: sin él, muchos navegadores desplazan la página pero dejan el foco donde estaba.

## 2. Atajos

**La aplicación no define atajos de teclado propios.** Es una decisión segura: los atajos personalizados suelen colisionar con los de los lectores de pantalla. Solo se usan las teclas estándar del navegador y `Escape` en el modal.

## 3. Orden de tabulación

No se detectó ningún `tabIndex` positivo en el código revisado. El orden de tabulación sigue el orden del DOM, que es lo correcto — un `tabIndex="1"` reordena el foco de toda la página y es una de las causas más frecuentes de trampas de teclado.

El único `tabIndex` presente es `-1` en `<main>`, cuyo uso es el adecuado: hace el elemento enfocable por programa sin insertarlo en el recorrido de `Tab`.

## 4. Recorrido esperado por superficie

### Sitio público
1. Enlace de salto (invisible hasta recibir foco)
2. Navegación de `PublicShell`
3. `<main>` — contenido de la página
4. Pie de página

### Portal privado
1. Enlace de salto
2. Barra lateral de `DashboardShell` (navegación por rol)
3. Campana de notificaciones (solo en `/admin`)
4. `<main>` — `PageHeader`, acciones, contenido
5. Tablas y controles de paginación

### Modal abierto
El foco queda confinado dentro del panel. `Escape` cierra y devuelve el foco al elemento que lo abrió.

## 5. Verificación pendiente

Lo siguiente **no se ha comprobado** en ejecución y requiere prueba manual:

| Superficie | Qué verificar |
|---|---|
| Overlay de tutoriales | Que el recorrido guiado no atrape el foco y que se pueda abandonar con teclado |
| `DataTable` con paginación | Que los botones anterior/siguiente sean alcanzables y estén etiquetados |
| `password-input` | Que el botón de alternar visibilidad sea enfocable y tenga nombre accesible |
| Menú móvil de `DashboardShell` | Que al abrirse mueva el foco y al cerrarse lo devuelva |
| `ConfirmProvider` | Que el diálogo de confirmación tenga el mismo tratamiento de foco que `Modal` |

El último punto es el de mayor riesgo: `confirm-dialog.tsx` es un componente distinto de `modal.tsx`, y **no se ha verificado que replique la trampa y restauración de foco**. Registrado dentro de `A11Y-01`.

## 6. Cómo probarlo

1. Cargar la página y pulsar `Tab` una vez: debe aparecer «Saltar al contenido principal».
2. Pulsar `Enter`: el foco debe quedar en el contenido, no solo desplazar la vista.
3. Recorrer toda la pantalla con `Tab` sin tocar el ratón; comprobar que el anillo de foco es visible en cada parada.
4. Abrir un modal, tabular en círculo y confirmar que no se escapa al fondo.
5. Cerrar con `Escape` y comprobar que el foco vuelve al botón de origen.

# Temas

- **Fecha de evidencia:** 2026-08-03
- **Estado:** tema claro y tema oscuro, ambos completos
- **Fuente:** [src/app/tokens.css](../../src/app/tokens.css), [src/shared/theme/](../../src/shared/theme/)

## 1. Estado

| Elemento | Estado |
|---|---|
| Tema claro | ✅ Por defecto, sin cambios respecto al diseño anterior |
| Tema oscuro | ✅ Implementado, incluida la landing pública |
| Seguir al sistema | ✅ Opción por defecto, reactiva en caliente |
| Selección manual | ✅ Selector en la cabecera pública y en los portales |
| Persistencia | ✅ `localStorage` (`cm_theme`) |
| Sincronización entre pestañas | ✅ Vía evento `storage` |
| Destello al cargar | ✅ Eliminado con script en línea |
| `color-scheme` | ✅ Lo declaran `:root` y `.dark`; ya no está fijo en `light` |
| `theme-color` del navegador | ✅ Sigue a la elección manual, no solo al sistema |

La contradicción registrada antes —`darkMode: ["class"]` configurado, cero clases `dark:` aplicadas y `colorScheme: "light"` fijo— queda resuelta. `PENDIENTE_CM_MODO_OSCURO` y el hallazgo `A11Y-08` están cerrados.

## 2. Cómo funciona

### El color

No hay clases `dark:` repartidas por los componentes. El tema se resuelve **entero en la capa de tokens**: `.dark` redefine las variables CSS y los ~1000 usos de color del producto cambian solos. Ver [tokens.md](./tokens.md) y [ADR-0011](../adr/ADR-0011-tokens-y-paletas-remapeadas.md).

Consecuencia práctica: **añadir una pantalla nueva no exige pensar en el tema oscuro**, siempre que use tokens en lugar de literales.

### El mecanismo

| Archivo | Papel |
|---|---|
| `src/shared/theme/theme.ts` | Tipos, constantes, lectura/escritura de la preferencia y `THEME_INIT_SCRIPT` |
| `src/shared/theme/theme-store.ts` | Almacén externo para `useSyncExternalStore` |
| `src/shared/theme/use-theme.tsx` | Hook `useTheme()` |
| `src/shared/ui/theme-toggle.tsx` | Selector de tres estados |

**No hay Provider.** El tema es estado del DOM (la clase en `<html>`), no del árbol de React. Un contexto obligaría a envolver la aplicación y volvería a renderizar todo el árbol en cada cambio; `useSyncExternalStore` lo lee desde donde haga falta y de paso resuelve la hidratación.

### Por qué un almacén externo y no `useState` + `useEffect`

Tres razones, en orden de peso:

1. El tema lo escribe el script del `<head>` **antes de que React exista**, y lo puede cambiar otra pestaña. No es estado de React.
2. Leerlo en un efecto de montaje obliga a un `setState` síncrono dentro del efecto, que es exactamente lo que prohíbe la regla `react-hooks` activa en el proyecto (renders en cascada). El build falla.
3. `useSyncExternalStore` distingue el snapshot de servidor del de cliente, así que no hay desajuste de hidratación que suprimir.

### El script anti-parpadeo

Con `output: "export"` el mismo HTML llega a todo el mundo, así que el servidor no puede saber qué tema eligió cada persona. Sin intervención, el documento se pinta en claro y salta a oscuro al hidratar: un destello blanco a pantalla completa.

`THEME_INIT_SCRIPT` se inyecta en el `<head>` y se ejecuta de forma síncrona antes del primer pintado. Va envuelto en `try/catch` porque un fallo ahí bloquearía el render de toda la página, y el peor caso aceptable es quedarse en claro.

Requiere `'unsafe-inline'` en `script-src`, que la CSP de `public/_headers` ya concede por el runtime de Next: **no se ha abierto ninguna directiva nueva**. La cadena se construye en tiempo de compilación con `JSON.stringify` sobre constantes internas; no interviene ningún dato de usuario.

`<html>` lleva `suppressHydrationWarning` porque el script cambia su atributo `class`. Es intencionado y afecta solo a ese elemento: no silencia desajustes dentro de la aplicación.

## 3. El selector

Tres estados —**Seguir al sistema**, **Claro**, **Oscuro**— y no un interruptor binario: «seguir al sistema» es un estado propio y el más útil por defecto. Con un interruptor de dos posiciones, quien tiene el móvil en oscuro por la noche pierde ese cambio automático en cuanto toca el control una vez.

Accesibilidad: `role="radiogroup"` con `aria-checked`, solo la opción activa entra en el orden de tabulación, y las flechas mueven la selección.

Antes de que el cliente lea el almacenamiento, ninguna opción se marca como activa: marcar una contradiría al HTML estático servido.

Ubicación: cabecera pública (escritorio) y cajón de navegación (móvil); barra lateral de los portales (escritorio) y cabecera móvil del portal.

## 4. Criterio del tema oscuro

No es una inversión mecánica. Se conservan los matices cálidos de la marca (12–38°) para que el producto no se vuelva azul-grisáceo genérico.

Dos decisiones que no son obvias:

- **Las secciones «inverse» pasan a ser paneles elevados.** En claro son marrón profundo sobre crema. En oscuro esa inversión desaparecería contra el fondo, así que se aclaran ligeramente respecto a la página: conservan el papel de «bloque destacado» que tenían en la composición.
- **`cm-glass` se invierte.** Un cristal al 72 % de blanco sobre fondo oscuro es un bloque lechoso ilegible; pasa a panel translúcido sobre `surface-raised`.

## 5. Verificación

| Prueba | Qué cubre |
|---|---|
| `tests/unit/theme.test.ts` (16) | Preferencia, resolución, aplicación al DOM, script anti-parpadeo, `localStorage` bloqueado |
| `tests/unit/theme-store.test.ts` (14) | Snapshots, notificación, cambio del SO, otra pestaña, baja |
| `tests/unit/design-tokens.test.ts` (12) | Paridad de tokens entre temas, formato HSL, escalas completas |
| `tests/e2e/theme.spec.ts` (16) | Pintado desde la primera carga en 6 rutas × 2 temas, persistencia, `color-scheme`, teclado, contraste |

La de paridad es la que más regresiones evitará: añadir un token al bloque claro y olvidarlo en el oscuro no rompe ni el build ni el lint, y solo se nota cuando alguien abre esa pantalla en oscuro.

## 6. Límite conocido

El contraste se ha construido conservando las luminosidades de la escala de partida, y hay una comprobación automática de que texto y fondo caen en lados opuestos de la escala. **No se ha ejecutado una auditoría de contraste WCAG par por par sobre el tema oscuro.** Queda registrado en [pending-items.md](../pending/pending-items.md) como `PENDIENTE_CM_CONTRASTE_OSCURO`.

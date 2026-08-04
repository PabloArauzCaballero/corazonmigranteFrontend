# Informe de implementación responsiva

Fecha: **2026-08-03** · Rama `main` · Stack: Next.js 15.4.7 · React 19.2 · Tailwind 3.4.19

Documentos relacionados:
[plan y auditoría](RESPONSIVE_AUDIT_AND_IMPLEMENTATION_PLAN.md) ·
[sistema de diseño](RESPONSIVE_DESIGN_SYSTEM.md) ·
[matriz de pruebas](RESPONSIVE_TEST_MATRIX.md)

---

## 1. Resumen de cambios

El diagnóstico mostró que el problema responsivo **no estaba repartido por pantallas,
sino concentrado en cuatro primitivas compartidas**. La intervención se hizo por tanto
en el sistema, no pantalla por pantalla:

- **4 primitivas críticas corregidas** → alcanzan a las 65 rutas del producto.
- **3 módulos nuevos** que dan a las 16 tablas del sistema una presentación móvil real
  **sin modificar ni una línea en sus pantallas**.
- **1 capa de utilidades responsivas** centralizada (áreas seguras, alto de ventana
  estable, desplazamiento contenido, objetivos táctiles, tipografía fluida).
- **2 suites de prueba nuevas** que impiden que el problema reaparezca.
- **0 cambios** en lógica de negocio, validaciones, peticiones HTTP, estado, rutas,
  permisos, contratos, traducciones o analítica.
- **0 dependencias añadidas.**

---

## 2. Problemas detectados y resueltos

| ID | Severidad | Problema | Estado |
|---|---|---|---|
| C1 | **Crítico** | Las 16 tablas forzaban `min-w-[760px]`: la columna de acciones quedaba siempre fuera de pantalla en móvil | ✅ Resuelto |
| C2 | **Crítico** | Los modales altos se recortaban por arriba, sin forma de recuperar la cabecera | ✅ Resuelto |
| C3 | **Crítico** | Las acciones de `PageHeader` no envolvían y desbordaban la página | ✅ Resuelto |
| H1 | Alto | Sin fuente única de breakpoints ni utilidades de área segura | ✅ Resuelto |
| H2 | Alto | Cadenas largas (correos, slugs, URLs) sin punto de corte | ✅ Resuelto |
| H3 | Alto | Padding fijo de `TableShell` consumía el 12,5 % del ancho a 320 px | ✅ Resuelto |
| H4 | Alto | `100vh` y ausencia de área segura dejaban controles inalcanzables | ✅ Resuelto |
| H5 | Alto | Sin prueba automática de desbordamiento horizontal | ✅ Resuelto |
| **H6** | **Alto** | **El aviso de carga de la landing desbordaba 32 px a 320 px** *(hallazgo durante la validación)* | ✅ Resuelto |
| **H7** | **Alto** | **El menú público quedaba inalcanzable en horizontal: scroll de fondo bloqueado y sin scroll propio** *(hallazgo durante la validación)* | ✅ Resuelto |
| M1 | Medio | Áreas táctiles ajustadas en grupos densos de botones-icono | ✅ Resuelto |
| M2 | Medio | Alturas de `<select>` inconsistentes (`h-10`/`h-11`/`h-14`) | 📋 Documentado, no ejecutado |
| M3 | Medio | Alturas de imagen fijas en la landing | ✅ Resuelto |
| M4 | Medio | Marca de cabecera sin `min-w-0` ni truncado | ✅ Resuelto |
| L1 | Bajo | Listener de `mousemove` activo en dispositivos táctiles | ✅ Resuelto |

**13 de 15 resueltos.** M2 queda documentado por decisión explícita (§9). Dos problemas
adicionales (H6, H7) se descubrieron durante la validación y también se corrigieron.

---

## 3. Detalle de los tres problemas críticos

### C1 — Las tablas eran inoperables en móvil

```text
Problema:  Las 16 tablas del producto forzaban 760 px de ancho mínimo. En un teléfono
           de 360 px se veía el 47 % de la tabla; el resto exigía arrastre horizontal
           sin ninguna señal de que existiera contenido oculto. La columna de acciones,
           siempre la última, quedaba sistemáticamente fuera de pantalla.
Causa:     `min-w-[760px]` en src/shared/ui/data-table.tsx (líneas 19 y 78), dentro de
           un `overflow-x-auto` sin indicador y sin presentación alternativa.
Impacto:   En móvil no se podía activar, bloquear, editar ni programar nada desde el
           panel admin sin descubrir por casualidad el arrastre horizontal.
Solución:  Estrategia doble dentro de la propia primitiva:
             • < md  → lista de tarjetas generada a partir de las MISMAS columnas
                       (encabezado = etiqueta, render = valor, acciones al pie).
             • ≥ md  → la tabla, con min-w reducido a 720 px, indicador de
                       desplazamiento (`scroll-x-hint`, sin JavaScript) y
                       `overscroll-behavior-x: contain`.
           `DataTableColumn` gana `priority` y `cardLabel`, ambos OPCIONALES; sin
           declararlos se infiere el comportamiento correcto.
Archivos:  src/shared/ui/data-table.tsx
           src/shared/ui/data-table-types.ts   (nuevo)
           src/shared/ui/data-table-cards.tsx  (nuevo)
Riesgo:    MEDIO — es la primitiva más usada del sistema.
Prueba:    tests/unit/data-table-responsive.test.tsx (10 casos) +
           tests/unit/ui-data-table.test.tsx (contrato general).
Resultado: ✅ Las 16 tablas ganaron vista móvil operativa con CERO cambios en sus
           pantallas. 368/368 pruebas unitarias en verde.
```

### C2 — Los modales altos se recortaban por arriba

```text
Problema:  Un diálogo más alto que la ventana quedaba centrado y su cabecera se salía
           por encima del área visible, sin posibilidad de volver a ella.
Causa:     `grid place-items-center` combinado con `overflow-y-auto` en el MISMO
           elemento (modal.tsx línea 94). Cuando el hijo supera la altura del
           contenedor, el centrado lo desplaza por encima del origen de scroll, que es
           inalcanzable. Tampoco había `max-height` ni scroll interno.
Impacto:   Formularios inutilizables en móvil y en escritorio con zoom al 200 %: no se
           llegaba al título, a los primeros campos ni, a veces, al botón de guardar.
Solución:  `flex items-start justify-center` + `my-auto` en el panel (centra cuando
           cabe, ancla arriba cuando no); `max-h-[calc(100dvh-1.5rem)]`; cabecera fija
           fuera del área desplazable; scroll trasladado al cuerpo con
           `overscroll-contain`; padding progresivo; área segura respetada.
Archivos:  src/shared/ui/modal.tsx
Riesgo:    BAJO — no se tocó la trampa de foco, `Escape`, la restauración de foco ni el
           bloqueo de scroll.
Prueba:    tests/unit/ui-modal.test.tsx en verde tras el cambio.
Resultado: ✅ Ningún diálogo excede la ventana; título y cerrar siempre visibles.
```

### C3 — Las acciones del encabezado desbordaban la página

```text
Problema:  Con dos o más acciones de cabecera, los botones se salían del ancho por
           debajo de ~400 px y generaban scroll horizontal en TODA la página.
Causa:     `flex items-center gap-2` sin `flex-wrap` en page-header.tsx, mientras que
           `Button` lleva `whitespace-nowrap` por diseño: nada podía encoger ni
           envolver. El título tampoco declaraba `break-words`.
Impacto:   Desbordamiento horizontal — el defecto explícitamente prohibido por los
           criterios de aceptación — en casi todas las pantallas de portal.
Solución:  `flex-wrap` en las acciones, `min-w-0` en la columna de texto, título con
           `break-words` y tamaño fluido `clamp()`.
Archivos:  src/shared/ui/page-header.tsx
Riesgo:    MUY BAJO — solo disposición.
Prueba:    Matriz E2E de 15 anchos.
Resultado: ✅ Las acciones envuelven; el escritorio conserva su fila alineada a la
           derecha.
```

### H6 y H7 — Hallazgos durante la validación

```text
Problema:  (H6) El aviso "Cargando pagina principal..." de la landing desbordaba 32 px
           a 320 px. (H7) El menú público bloquea el scroll del cuerpo al abrirse pero
           no tenía scroll propio: en orientación horizontal (568×320) sus últimos
           controles quedaban inalcanzables.
Causa:     (H6) Fila flex sin `max-w-full` cuyo ancho mínimo — icono + hueco + texto +
           relleno — superaba el de la pantalla. (H7) Altura sin acotar.
Impacto:   H6 afecta a la PRIMERA pantalla que ve cualquier persona mientras responde
           el backend, y al estado de error cuando no responde. H7 impedía navegar con
           el teléfono en horizontal.
Solución:  (H6) `max-w-full` + `min-w-0` + `shrink-0` en el icono + padding progresivo;
           el estado de error apila icono y texto en móvil y añade `min-w-0` para que
           el titular pueda partirse. (H7) `max-h-[calc(100dvh-5rem)]` +
           `overflow-y-auto overscroll-contain` + `pb-safe`.
Archivos:  src/features/public-view/public-landing-loader.tsx
           src/features/landing/public-shell.tsx
Riesgo:    MUY BAJO.
Prueba:    Matriz E2E (H6, visible en la captura de landing a 320 px) y prueba de
           comportamiento del menú a 320 px (H7).
Resultado: ✅ Ambos corregidos y verificados.
```

---

## 4. Archivos modificados

### 4.1 Componentes nuevos (3)

| Archivo | Propósito |
|---|---|
| `src/shared/ui/breakpoints.ts` | Fuente única de breakpoints, tope de contenido y objetivos táctiles |
| `src/shared/ui/data-table-types.ts` | Tipo de columna + inferencia de prioridad |
| `src/shared/ui/data-table-cards.tsx` | Vista compacta de tarjetas para `DataTable` |

### 4.2 Primitivas refactorizadas (6)

| Archivo | Cambio |
|---|---|
| `src/shared/ui/data-table.tsx` | Vista doble tarjetas/tabla; `min-w` 760 → 720; indicador de desplazamiento |
| `src/shared/ui/modal.tsx` | Anclaje superior, `max-h` en `dvh`, cabecera fija, cuerpo desplazable, área segura |
| `src/shared/ui/page-header.tsx` | `flex-wrap` en acciones, `min-w-0`, título fluido con `break-words` |
| `src/shared/ui/table-shell.tsx` | Padding progresivo `px-3 sm:px-5` |
| `src/shared/ui/card.tsx` | Padding `p-4 sm:p-6`, título fluido, `flex-wrap` en el pie |
| `src/shared/ui/button.tsx` | `.touch-target` en los tamaños `sm` e `icon` |

### 4.3 Estructura y pantallas (8)

| Archivo | Cambio |
|---|---|
| `src/app/globals.css` | Capa de utilidades responsivas; `overflow-x: clip`; `overflow-wrap` global |
| `src/features/dashboard/sidebar.tsx` | Cajón con `h-dvh` y `pb-safe`; padding progresivo del contenido |
| `src/features/landing/public-shell.tsx` | Cabecera 64→80 px progresiva; marca con `min-w-0`; menú con scroll propio |
| `src/features/public-view/public-landing-loader.tsx` | Estados de carga y error responsivos (H6) |
| `src/features/public-view/landing-v2-page.tsx` | Cabecera y alturas progresivas; `vh` → `dvh`; tira de píldoras contenida |
| `src/features/public-view/public-landing-page.tsx` | Altura de sección progresiva |
| `src/features/public-view/landing-sections.tsx` | Altura y relleno progresivos |
| `src/features/dashboard/reactive-background.tsx` | Listener solo con `pointer: fine` |

Además: `src/features/editorial/editorial-public-page.tsx` y
`src/features/newsroom/news-public.tsx` (alturas progresivas).

### 4.4 Pruebas (3)

| Archivo | Contenido |
|---|---|
| `tests/e2e/responsive.spec.ts` | Matriz de 15 anchos × 8 rutas + menú móvil + táctil + zoom 200 % |
| `tests/unit/data-table-responsive.test.tsx` | 10 casos sobre la vista de tarjetas y la inferencia de prioridad |
| `playwright.config.ts` | Proyecto `responsive` sin emulación de dispositivo |

---

## 5. Breakpoints utilizados

Sin valores nuevos: se usa la escala de Tailwind que el proyecto ya empleaba, ahora
explícita en `src/shared/ui/breakpoints.ts`.

| Nombre | Ancho | Papel |
|---|---:|---|
| base | 0–639 | Móvil (punto de partida) |
| `sm` | 640 | Espaciados y tamaños plenos |
| `md` | 768 | **Umbral tabla ↔ tarjetas** y `PageHeader` en fila |
| `lg` | 1024 | Barra lateral fija del portal |
| `xl` | 1280 | Navegación completa de la landing |
| `2xl` | 1536 | — |

Único breakpoint arbitrario del proyecto: `min-[380px]`, para suprimir el descriptivo
de la marca en los teléfonos más estrechos. Justificado en el propio código.

---

## 6. Estrategias aplicadas

### 6.1 Tablas

**Doble presentación, automática.** Por debajo de `md`, una tarjeta por fila generada a
partir de las mismas columnas: primera columna como título, resto como pares
etiqueta/valor en un `<dl>`, acciones agrupadas al pie. Por encima, la tabla con
desplazamiento contenido e indicador visual.

Se conservan **íntegros** ordenamiento, filtros, paginación, selección, acciones,
estados y permisos: la vista de tarjetas invoca `render` tal cual, de modo que badges,
botones y modales siguen funcionando igual.

Descartado: resolverlo solo con desplazamiento horizontal (deja las acciones fuera de
pantalla) y ocultar columnas (pérdida de información sin alternativa).

### 6.2 Navegación

| Shell | Compacto | Amplio |
|---|---|---|
| Portal | Cabecera + cajón lateral, `h-dvh`, `pb-safe`, cierre al navegar y con `Escape` | Barra lateral fija `w-64` (`lg+`) |
| Público | Cabecera 64 px + menú desplegable con scroll propio | Nav horizontal (`md+`) |

Ambos shells ya bloqueaban el scroll de fondo y lo restauraban al cerrar; se conservó
ese comportamiento y se añadió lo que faltaba: alto estable, área segura y scroll propio
del panel.

### 6.3 Formularios

Los formularios ya usaban `grid gap-* md:grid-cols-2`, que colapsa correctamente a una
columna. Lo que faltaba estaba **aguas arriba**, y ahí se corrigió: modales con scroll
interno para que el teclado virtual no tape los últimos campos, padding progresivo en
tarjetas y contenedores, y acciones que envuelven.

No se tocó ningún nombre de campo, payload ni regla de validación.

### 6.4 Accesibilidad

| Mejora | Detalle |
|---|---|
| Objetivos táctiles | 44 px efectivos en controles compactos, solo con `pointer: coarse`, sin cambiar el aspecto |
| Semántica de tarjetas | `dl`/`dt`/`dd`: la relación etiqueta→valor deja de ser posicional |
| Foco en diálogos | Trampa de foco, `Escape` y restauración **preservados** |
| Zoom 200 % | Verificado por prueba dedicada; `maximumScale` sigue libre (WCAG 1.4.4) |
| Texto legible | Sin reducciones de tamaño para «hacer caber»; se envuelve o reorganiza |
| Movimiento reducido | Cortes `prefers-reduced-motion` conservados y ampliados |
| Alcance real | La prueba de menú móvil exige que **todo** enlace esté dentro del viewport |

---

## 7. Resultados de validación

### Antes (línea base, antes de tocar nada)

```text
yarn typecheck   ✅ limpio
yarn lint        ✅ limpio
```

### Después

| Validación | Resultado |
|---|---|
| `yarn typecheck` | ✅ limpio |
| `yarn lint` (`--max-warnings=0`) | ✅ limpio |
| `yarn build` | ✅ 69 páginas generadas |
| `yarn test:unit` | ✅ **368 / 368** en 35 suites |
| `yarn test:smoke` | ✅ correcto |
| `npx playwright test --project=responsive` | ✅ **124 / 124** |

**Cero regresiones.** El resultado es igual o mejor que la línea base en todas las
validaciones, con 124 comprobaciones y 10 pruebas unitarias añadidas.

### Evidencia visual

`tests/e2e/__screenshots__/responsive/` — 20 capturas (4 rutas × 5 anchos), todas con
**0 px de desbordamiento horizontal**. Detalle en la
[matriz de pruebas](RESPONSIVE_TEST_MATRIX.md).

---

## 8. Verificación de no regresión funcional

| Área | Estado |
|---|---|
| Lógica de negocio | ✅ Sin cambios |
| Validaciones y esquemas `zod` | ✅ Sin cambios |
| Peticiones HTTP y contratos API | ✅ Sin cambios |
| Estado global y local | ✅ Sin cambios |
| Rutas y navegación | ✅ Sin cambios (65 rutas intactas) |
| Autenticación, autorización y permisos por rol | ✅ Sin cambios |
| Formularios: nombres de campo, payloads | ✅ Sin cambios |
| Eventos, integraciones, traducciones, analítica | ✅ Sin cambios |
| Dependencias y lockfile | ✅ Sin cambios |
| Identidad visual (paleta, radios, tipografías) | ✅ Sin cambios |
| Escritorio | ✅ Sin cambios — todo lo nuevo va tras `sm:`/`md:` |

---

## 9. Riesgos y limitaciones restantes

1. **Las rutas de portal no están en la matriz E2E.** Requieren sesión autenticada
   contra un backend. Su cobertura es indirecta —vía las primitivas compartidas, con
   prueba unitaria— pero no directa. *Recomendación: proyecto E2E autenticado cuando
   exista un backend de pruebas con credenciales sintéticas.*
2. **El contenido real de la landing no se ejercita en la matriz**, porque el entorno de
   pruebas no tiene backend y `/` sirve su estado de carga. Se cubre indirectamente en
   `/biblioteca`, `/novedades`, `/cursos` y `/registro`.
3. **Sin comparación automatizada de imágenes.** Las capturas son evidencia para
   revisión humana.
4. **Sin verificación en dispositivos físicos ni en Safari/iOS.** Toda la matriz corre
   en Chromium; las utilidades empleadas tienen soporte pleno en los navegadores
   objetivo.
5. **Teclado virtual no emulable** en Playwright de escritorio. La mitigación es
   estructural, no verificada en dispositivo real.

### Trabajo declarado fuera de alcance

Por la regla de no cambiar el producto sin autorización:

- **Migración de `<select>` nativos a una primitiva `Select`** (M2). Conviven alturas
  `h-10`/`h-11`/`h-14`. Es un desajuste de ritmo vertical visible en móvil, pero **no
  rompe el layout**; migrarlo es un cambio cosmético de gran alcance.
  *Propuesta: crear `Select` con la altura canónica de 44 px y migrar por pantallas.*
- **División de archivos grandes.** `landing-v2-page.tsx` (1063 L) y
  `public-view.normalizer.ts` (1058 L) superan la guía de 300 líneas. Trocearlos es una
  refactorización arquitectónica sin efecto responsivo.
  *Propuesta: extraer las secciones de la landing a módulos por sección.*

---

## 10. Recomendaciones de mantenimiento

1. **Ejecuta `npx playwright test --project=responsive` en cada PR que toque la
   interfaz.** Es la red que impide reintroducir el desbordamiento horizontal.
2. **Corrige en la primitiva, no en la pantalla.** Si una pantalla necesita una media
   query propia, casi siempre es señal de que falta una variante en el componente
   compartido.
3. **Añade cada ruta pública nueva a `PUBLIC_ROUTES`** en `tests/e2e/responsive.spec.ts`.
4. **Usa `priority` y `cardLabel`** para afinar la vista móvil de una tabla concreta, en
   lugar de envolverla en CSS a medida.
5. **Consulta la lista de comprobación** del
   [sistema de diseño](RESPONSIVE_DESIGN_SYSTEM.md#7-lista-de-comprobación-para-pantallas-nuevas)
   antes de dar por terminada una pantalla nueva.
6. **Prueba siempre con datos reales y textos largos**, no solo con datos de ejemplo:
   la mayoría de los desbordamientos aparecen con correos, slugs y titulares reales.

---

## 11. Conclusión

Los tres defectos críticos están corregidos en la raíz —las primitivas compartidas—, de
modo que la solución alcanza a las 65 rutas del producto sin haber parcheado ninguna
pantalla de forma aislada. Dos defectos adicionales aparecieron durante la validación y
también quedaron resueltos.

Las 120 combinaciones de ancho × ruta, las cuatro comprobaciones de comportamiento y las
368 pruebas unitarias están en verde, con `lint`, `typecheck` y `build` limpios y sin
regresión alguna respecto de la línea base.

Las limitaciones que quedan están **declaradas, acotadas y acompañadas de una
recomendación concreta**; ninguna afecta a los criterios de aceptación acordados.

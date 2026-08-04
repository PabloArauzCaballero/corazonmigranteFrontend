# Auditoría responsiva y plan de implementación

> Estado: **Completado.** Resultados en
> [`RESPONSIVE_IMPLEMENTATION_REPORT.md`](RESPONSIVE_IMPLEMENTATION_REPORT.md).
> Fecha de evidencia: 2026-08-03
> Alcance: `corazonmigranteFrontend` (rama `main`)

---

## 1. Resumen ejecutivo

El frontend **ya parte de una base sólida**: existe `viewport` con `width=device-width`,
los dos shells de navegación (público y de portal) tienen cajón móvil con bloqueo de
scroll, `Escape` y cierre al navegar, hay soporte de `prefers-reduced-motion` y un hook
`useMediaQuery` basado en `useSyncExternalStore`. La línea base de `lint` y `typecheck`
pasa en verde antes de tocar nada.

El problema responsivo real **no está repartido por pantallas: está concentrado en cuatro
primitivas compartidas**. Corregirlas arregla decenas de pantallas a la vez:

| Primitiva | Consumidores | Efecto del defecto |
|---|---:|---|
| `DataTable` | 16 features | Toda tabla del sistema fuerza 760 px de ancho |
| `Modal` | Transversal | Diálogos altos se recortan por arriba y no tienen scroll interno |
| `PageHeader` | Casi todas las pantallas de portal | La fila de acciones no envuelve y desborda |
| `TableShell` | 3 features + patrón copiado | Padding fijo que consume el 14 % del ancho a 320 px |

La estrategia es por tanto **centralizar, no parchear pantalla por pantalla**, tal y como
exige el mandato: se corrigen las primitivas y se añade una red de seguridad automatizada
(prueba E2E de desbordamiento horizontal sobre la matriz de anchos) para que el problema
no reaparezca al crecer el producto.

---

## 2. Stack detectado

Todo lo siguiente está **verificado en el repositorio**, no supuesto.

| Área | Tecnología | Evidencia |
|---|---|---|
| Framework | Next.js `15.4.7`, App Router | `package.json`, `src/app/**` |
| Runtime UI | React `19.2.0` | `package.json` |
| Lenguaje | TypeScript `5.9.3`, `strict` | `tsconfig.json`, script `typecheck` |
| Estilos | Tailwind CSS `3.4.19` + `@tailwindcss/forms` | `tailwind.config.ts`, `postcss.config.mjs` |
| Primitivas accesibles | Radix UI (`dialog`, `label`, `slot`, `tabs`) | `package.json` |
| Variantes | `class-variance-authority` + `tailwind-merge` + `clsx` | `src/shared/ui/button.tsx`, `src/lib/utils.ts` |
| Iconos | `lucide-react` `0.561` (+ wrapper `fontawesome.tsx`) | `src/shared/ui/fontawesome.tsx` |
| Estado servidor | TanStack Query `5.90` | `src/app/providers.tsx` |
| Estado cliente | React state + contexto de sesión | `src/shared/auth/use-session.tsx` |
| Formularios | `react-hook-form` `7.68` + `zod` `4.2` + `@hookform/resolvers` | `package.json` |
| Tablas | **Sin librería** — `DataTable` propia | `src/shared/ui/data-table.tsx` |
| Gráficos | **Ninguna librería instalada** | verificado en `package.json` |
| Observabilidad | OpenTelemetry web | `src/observability/**` |
| Tests | Jest 30 + Testing Library; Playwright `1.61` (desktop/tablet/mobile) | `playwright.config.ts`, `tests/**` |
| Lint / formato | ESLint 9 (`--max-warnings=0`) + Prettier 3 | `package.json` |
| Gestor de paquetes | **Yarn 4.9.2** (no npm) | `packageManager` |
| Node | `>=20.18.0` | `engines` |

**Conclusión de stack:** no hay que introducir ninguna dependencia. Tailwind ya cubre todo
lo necesario; la solución debe ser CSS-first y vivir en las primitivas compartidas.

### Tokens ya existentes que se reutilizan

- Paleta de marca remapeada sobre `teal.*` y variables HSL (`--primary`, `--muted`, …).
- `container`: centrado, `padding: 1rem`, tope `2xl: 1200px`.
- `--radius: 1rem`, sombra `soft`, fuentes variables `Fraunces` / `Manrope`.
- Animaciones del sistema con corte por `prefers-reduced-motion`.

> **Decisión conservada:** no se toca la identidad visual — ni paleta, ni radios, ni
> tipografías, ni el tope de 1200 px del contenedor.

---

## 3. Inventario de rutas

**65 archivos de ruta** (`page.tsx` / `layout.tsx`) en cuatro zonas.

### 3.1 Público — `src/app/(public)/` (15 rutas)

`/` · `/[slug]` · `/biblioteca` · `/biblioteca/recurso` · `/booking` · `/cursos` ·
`/login` · `/admin/login` · `/registro` · `/noticias` · `/noticias/detalle` ·
`/novedades` · `/novedades/detalle` · `/privacidad` · `/terminos`

Shell: `PublicShell` (`src/features/landing/public-shell.tsx`) — cabecera fija de 80 px,
nav horizontal ≥`md`, cajón móvil por debajo.

### 3.2 Admin — `src/app/admin/` (31 rutas)

Panel, notificaciones, solicitudes, booking, usuarios, descargables, archivos,
publicidad (4), productos (2), contenido (9), contabilidad (5), vistas públicas, ayuda.

Shell: `DashboardShell` — sidebar fija `w-64` en `lg+`, cabecera + cajón por debajo.
**Es la zona con mayor densidad de tablas y por tanto la más afectada.**

### 3.3 Paciente — `src/app/paciente/` (7 rutas)

Resumen · citas · booking · premium · descargables · perfil · ayuda.

### 3.4 Terapeuta — `src/app/terapeuta/` (7 rutas)

Resumen · agenda · horarios · booking · perfil · ayuda.

### 3.5 Transversales

`/403`, `global-error.tsx` y un `error.tsx` por zona (4).

---

## 4. Inventario de componentes críticos

### 4.1 Primitivas compartidas — `src/shared/ui/`

| Componente | Rol | Riesgo responsivo |
|---|---|---|
| `data-table.tsx` | Tabla + skeleton + paginación | **CRÍTICO** |
| `modal.tsx` | Diálogo con trampa de foco | **CRÍTICO** |
| `page-header.tsx` | Encabezado + acciones | **CRÍTICO** |
| `table-shell.tsx` | Contenedor filtros/tabla/pie | ALTO |
| `button.tsx` | CVA, 5 variantes, 4 tamaños | MEDIO (área táctil) |
| `input.tsx` / `textarea.tsx` / `label.tsx` | Campos | BAJO (ya `w-full`) |
| `card.tsx`, `badge.tsx`, `state.tsx` | Contenedores y estados | BAJO |
| `toast.tsx` | Notificación | BAJO (ya usa `min(20rem, 100vw-3rem)`) |
| `confirm-dialog.tsx` | Confirmación | Hereda de `Modal` |
| `smart-image.tsx` | Imagen con degradación | BAJO |
| `auth-visual-layout.tsx` | Layout de login/registro | MEDIO |

### 4.2 Shells de navegación

- `src/features/dashboard/sidebar.tsx` (373 L) — `DashboardShell`, 3 catálogos de
  navegación (paciente 7, terapeuta 6, admin 22 enlaces + grupo colapsable).
- `src/features/landing/public-shell.tsx` (330 L).
- `src/features/dashboard/reactive-background.tsx` — fondo con `mousemove`.

### 4.3 Consumidores de `DataTable` (16)

`accounting-table` · `transactions-table` · `downloadables-admin` ·
`editorial-admin-page` · `files-admin` · `newsroom-admin-ads` ·
`newsroom-admin-publications` · `newsroom-admin-subscribers` ·
`newsroom-admin-taxonomy` · `products-table` · `public-content-table` ·
`patient-appointments-table` · `requests-table` · `schedule-manager` ·
`therapist-agenda-table` · `users-table`

> Cualquier arreglo aplicado dentro de `DataTable` alcanza a las 16 sin tocarlas.

### 4.4 Pantallas densas

`landing-v2-page.tsx` (1063 L) · `public-landing-page.tsx` (729 L) ·
`booking-form.tsx` (474 L) · `users-table.tsx` (464 L) · `files-admin.tsx` (387 L).

---

## 5. Problemas encontrados, severidad y estrategia

Formato exigido por el mandato: *Problema / Causa / Impacto / Solución / Archivos / Riesgo*.

---

### C1 — Toda tabla del sistema fuerza 760 px de ancho · **CRÍTICO**

```text
Problema:  Las 16 tablas del producto son ilegibles y difíciles de operar por debajo
           de 760 px. En un móvil de 360 px se ve el 47 % de la tabla y el resto exige
           arrastre horizontal sin ninguna señal de que exista contenido oculto.
Causa:     src/shared/ui/data-table.tsx aplica `min-w-[760px]` al <table> (líneas 19 y
           78), dentro de un `overflow-x-auto` sin indicador de desplazamiento. No hay
           ninguna presentación alternativa para pantallas estrechas.
Impacto:   Las columnas de acciones quedan sistemáticamente fuera de pantalla — es
           decir, en móvil no se puede activar, bloquear, editar ni programar nada
           desde el panel admin sin descubrir el arrastre horizontal.
Solución:  Estrategia doble dentro de la propia primitiva:
             • < md  → lista de tarjetas generada a partir de las MISMAS columnas
                       (encabezado = etiqueta, render = valor). Cero cambios en las
                       16 llamadas.
             • ≥ md  → la tabla actual, con `min-w` reducido a 720 px, indicador de
                       desplazamiento y `overscroll-behavior-x: contain`.
           Se amplía `DataTableColumn` con campos OPCIONALES (`priority`, `cardLabel`)
           para que cada tabla pueda afinar después sin romper nada hoy.
Archivos:  src/shared/ui/data-table.tsx
Riesgo:    MEDIO — es la primitiva más usada. Mitigación: los campos nuevos son
           opcionales, la firma pública no cambia y la vista de tarjetas reutiliza
           `render` tal cual, por lo que botones, badges y modales siguen operando.
```

---

### C2 — Los diálogos altos se recortan por arriba · **CRÍTICO**

```text
Problema:  Un modal más alto que la ventana (p. ej. "Información de {terapeuta}" o los
           horarios) queda centrado y su cabecera se sale por encima del área visible,
           sin posibilidad de volver a ella.
Causa:     src/shared/ui/modal.tsx línea 94 combina `grid place-items-center` con
           `overflow-y-auto` en el mismo elemento. Cuando el hijo supera la altura del
           contenedor, el centrado desplaza el contenido por encima del origen de
           scroll, que es inalcanzable. El panel tampoco tiene `max-height` ni scroll
           interno, y usa `p-6` fijo también a 320 px.
Impacto:   Formularios inutilizables en móvil y en escritorio con zoom al 200 %: no se
           llega al título, a los primeros campos ni, en algunos casos, al botón de
           guardar.
Solución:  Sustituir el centrado por `flex items-start justify-center` con `my-auto` en
           el panel (centra cuando cabe, ancla arriba cuando no), acotar con
           `max-h-[calc(100dvh-2rem)]`, mover el scroll al cuerpo del diálogo, dejar
           cabecera y acciones fuera del área desplazable, padding progresivo
           (`p-4 sm:p-6`) y respeto del área segura.
Archivos:  src/shared/ui/modal.tsx
Riesgo:    BAJO — no se toca la trampa de foco, ni `Escape`, ni la restauración de foco,
           ni el bloqueo de scroll, ni la firma del componente.
```

---

### C3 — La fila de acciones del encabezado desborda · **CRÍTICO**

```text
Problema:  En pantallas con dos o más acciones de cabecera, los botones se salen del
           ancho por debajo de ~400 px y generan scroll horizontal en toda la página.
Causa:     src/shared/ui/page-header.tsx línea 23: `flex items-center gap-2` sin
           `flex-wrap`, y `Button` lleva `whitespace-nowrap` por diseño, de modo que
           nada puede encoger ni envolver. El título `text-3xl` tampoco declara
           `break-words`.
Impacto:   Desbordamiento horizontal de página — el defecto explícitamente prohibido
           por los criterios de aceptación — en casi todas las pantallas de portal.
Solución:  `flex-wrap` en las acciones, `min-w-0` en la columna de texto, título con
           `break-words` y tamaño fluido con `clamp()` entre móvil y escritorio.
Archivos:  src/shared/ui/page-header.tsx
Riesgo:    MUY BAJO — solo afecta a la disposición.
```

---

### H1 — No hay fuente única de breakpoints ni de área segura · **ALTO**

```text
Problema:  Los breakpoints viven implícitos en las clases de Tailwind, no hay tokens de
           área segura (notch / indicador de inicio) ni utilidades compartidas de
           desbordamiento; cada pantalla resuelve por su cuenta.
Causa:     `tailwind.config.ts` solo personaliza `container.screens["2xl"]`; el resto
           son los valores por defecto, nunca documentados ni expuestos a JS/pruebas.
Impacto:   Riesgo de divergencia futura: media queries por milímetros, y las pruebas no
           pueden compartir la misma matriz de anchos que el CSS.
Solución:  Crear `src/shared/ui/breakpoints.ts` como fuente única (consumible por
           componentes y por la prueba E2E) y añadir a `globals.css` utilidades de área
           segura y de envoltura de texto. No se alteran los valores actuales de
           Tailwind: solo se explicitan.
Archivos:  src/shared/ui/breakpoints.ts (nuevo), src/app/globals.css
Riesgo:    MUY BAJO — aditivo.
```

---

### H2 — Cadenas largas sin punto de corte · **ALTO**

```text
Problema:  Correos, URLs de archivo y slugs largos ensanchan su contenedor y provocan
           desbordamiento, sobre todo en celdas de tabla y en la futura vista de
           tarjetas.
Causa:     No existe regla global de `overflow-wrap`; el navegador solo parte en
           espacios y estos identificadores no los tienen.
Impacto:   Desbordamiento horizontal con datos reales, aunque con datos de prueba
           cortos no se manifieste.
Solución:  `overflow-wrap: break-word` global en `body` y ruptura explícita en los
           valores de las tarjetas de tabla.
Archivos:  src/app/globals.css, src/shared/ui/data-table.tsx
Riesgo:    MUY BAJO.
```

---

### H3 — Padding fijo en contenedores de tabla · **ALTO**

```text
Problema:  A 320 px, `TableShell` consume 40 px (12,5 % del ancho) solo en padding
           propio, sumados a los 32 px del contenedor de página.
Causa:     src/shared/ui/table-shell.tsx: `px-5 py-4` y `p-5` fijos en los tres huecos.
Impacto:   Filtros y tabla apretados en el rango 320–390 px.
Solución:  Padding progresivo `px-3 sm:px-5`, y en la barra de filtros permitir que los
           controles ocupen el ancho completo en móvil.
Archivos:  src/shared/ui/table-shell.tsx
Riesgo:    MUY BAJO.
```

---

### H4 — Áreas seguras y `100vh` en móvil · **ALTO**

```text
Problema:  En iOS/Android con barras dinámicas, `100vh` es mayor que el área realmente
           visible: el botón "Cerrar sesión" al pie del cajón y el pie de los modales
           quedan bajo la barra del navegador o el indicador de inicio.
Causa:     `min-h-screen` (=100vh) en los shells y ausencia de `env(safe-area-inset-*)`.
Impacto:   Acciones inalcanzables en móviles con notch.
Solución:  `100dvh` donde la altura afecta a controles alcanzables y utilidades
           `.pb-safe` / `.px-safe` en cajones y modales. `body` ya usa `min-height:100dvh`.
Archivos:  src/app/globals.css, src/features/dashboard/sidebar.tsx,
           src/features/landing/public-shell.tsx, src/shared/ui/modal.tsx
Riesgo:    BAJO.
```

---

### H5 — No hay prueba automática de desbordamiento · **ALTO**

```text
Problema:  Nada impide que una pantalla nueva reintroduzca scroll horizontal.
Causa:     Playwright existe pero solo cubre revisión visual de la landing, tutoriales y
           observabilidad; ninguna prueba comprueba `scrollWidth <= clientWidth`.
Impacto:   Toda esta auditoría se degrada con el tiempo sin una red de seguridad.
Solución:  `tests/e2e/responsive.spec.ts`: recorre la matriz de 10 anchos sobre las
           rutas públicas y afirma ausencia de desbordamiento, además de comprobar el
           cajón móvil y las áreas táctiles.
Archivos:  tests/e2e/responsive.spec.ts (nuevo), playwright.config.ts
Riesgo:    NULO — solo añade cobertura.
```

---

### M1 — Áreas táctiles ajustadas en grupos de acciones · **MEDIO**

```text
Problema:  `Button size="sm"` mide 36 px y `size="icon"` 40 px. En las celdas de acciones
           llegan a apilarse cuatro botones-icono contiguos con 8 px de separación.
Causa:     Escala de tamaños de `button.tsx` pensada para ratón.
Impacto:   Cumple WCAG 2.2 AA (2.5.8 exige 24×24 px) pero incomoda con el dedo y provoca
           pulsaciones erróneas entre acciones destructivas y no destructivas.
Solución:  Elevar el objetivo táctil sin cambiar la apariencia, mediante área de pulsado
           extendida en punteros gruesos (`@media (pointer: coarse)`), sin alterar
           ninguna medida visual ni el layout.
Archivos:  src/app/globals.css, src/shared/ui/button.tsx
Riesgo:    BAJO — no cambia dimensiones visibles.
```

---

### M2 — Alturas de control inconsistentes · **MEDIO**

```text
Problema:  Conviven `<select>` nativos con `h-10`, `h-11` y `h-14` junto a `Input` de
           `h-11`; en el layout de una columna en móvil el desajuste es muy visible.
Causa:     No existe primitiva `Select`; cada pantalla replica clases a mano.
Impacto:   Ritmo vertical irregular en formularios móviles. No rompe el layout.
Solución:  Documentar la altura de control canónica (44 px / `h-11`) en el sistema de
           diseño y aportar la primitiva `Select` para uso futuro. NO se migran en masa
           las pantallas existentes: sería un cambio cosmético de amplio alcance sin
           beneficio responsivo directo, y el mandato lo desaconseja.
Archivos:  docs/RESPONSIVE_DESIGN_SYSTEM.md
Riesgo:    NULO — decisión documentada, no ejecutada.
```

---

### M3 — Alturas de imagen fijas en la landing · **MEDIO**

```text
Problema:  `h-[26rem]`, `h-[34rem]` y `min-h-[28rem]` en las secciones de la landing.
Causa:     Medidas pensadas para escritorio.
Impacto:   No desbordan (todas llevan `w-full object-cover`), pero 544 px ocupan el 85 %
           de la altura de un teléfono de 640 px.
Solución:  Altura progresiva por breakpoint conservando la proporción de escritorio.
Archivos:  src/features/public-view/landing-v2-page.tsx
Riesgo:    BAJO — cambio visual solo por debajo de `md`, intencional y documentado.
```

---

### M4 — Marca de cabecera sin truncado · **MEDIO**

```text
Problema:  El bloque de marca de `PublicShell` (logo 48 px + dos líneas de texto) compite
           con el botón de menú a 320 px sin `min-w-0` ni truncado.
Causa:     `flex` sin `min-w-0`: un hijo flex no encoge por debajo de su contenido.
Impacto:   Desbordamiento potencial en el móvil más pequeño de la matriz.
Solución:  `min-w-0` + `truncate` en el subtítulo.
Archivos:  src/features/landing/public-shell.tsx
Riesgo:    MUY BAJO.
```

---

### L1 — Listener de ratón en dispositivos táctiles · **BAJO**

```text
Problema:  `ReactiveBackground` registra `mousemove` en global también en táctiles,
           donde el efecto nunca se aprecia.
Causa:     No se consulta `(pointer: fine)`.
Impacto:   Coste mínimo (listener pasivo + rAF), pero es trabajo inútil en el
           dispositivo con menos batería.
Solución:  Registrar solo con puntero fino.
Archivos:  src/features/dashboard/reactive-background.tsx
Riesgo:    NULO — degradación ya prevista por el propio componente.
```

---

## 6. Matriz de evaluación

| Categoría | Ancho | Comprobación principal |
|---|---:|---|
| Móvil muy pequeño | 320 px | Tarjetas de tabla, encabezados, modales |
| Móvil pequeño | 360 px | Cajón de navegación, formularios |
| Móvil estándar | 390 px | Flujo de reserva |
| Móvil grande | 430 px | Landing, densidad de contenido |
| Tablet vertical | 768 px | Transición tarjetas → tabla |
| Tablet horizontal | 1024 px | Sidebar compacta |
| Laptop | 1280 px | Sidebar fija + contenido |
| Escritorio | 1440 px | Referencia de diseño |
| Escritorio grande | 1920 px | Tope de contenedor 1200 px |
| Ultraancha | 2560 px | Centrado, sin estiramiento |

Anchos intermedios adicionales verificados por la prueba E2E: 344, 412, 600, 834, 1152.

Condiciones extra: orientación horizontal · zoom 200 % · textos largos · datos vacíos ·
errores de validación · menús y modales abiertos.

---

## 7. Orden de implementación

1. **Fundamentos** — `breakpoints.ts`, utilidades en `globals.css` (H1, H2, H4, M1).
2. **Primitivas críticas** — `DataTable` (C1), `Modal` (C2), `PageHeader` (C3).
3. **Contenedores** — `TableShell` (H3).
4. **Shells** — cajón del portal y cabecera pública (H4, M4).
5. **Pantallas** — landing (M3), fondo reactivo (L1).
6. **Red de seguridad** — prueba E2E de desbordamiento (H5).
7. **Validación** — `lint`, `typecheck`, `build`, `test:unit`, smoke.

---

## 8. Riesgos de regresión y mitigación

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| La vista de tarjetas rompe alguna de las 16 tablas | Media | Reutiliza `render` sin modificarlo; campos nuevos opcionales; `typecheck` + smokes de acciones admin |
| El cambio de `Modal` afecta a la trampa de foco | Baja | No se toca el efecto de foco/teclado; solo clases de layout |
| Regresión visual en escritorio | Baja | Todos los cambios se acotan con prefijos `sm:`/`md:`; escritorio conserva las clases actuales |
| `overflow-wrap` global altera textos | Muy baja | `break-word` solo parte cuando la palabra no cabe |
| `100dvh` sin soporte | Muy baja | Soportado en todos los navegadores objetivo; `min-h-screen` permanece como reserva |

---

## 9. Criterios de aceptación

- [x] Sin scroll horizontal en los anchos de la matriz — **124/124** en E2E (15 anchos).
- [x] Toda tabla operable a 320 px con acceso a **todas** sus acciones — vista de
      tarjetas, con prueba unitaria de que la acción responde y recibe la fila correcta.
- [x] Ningún modal excede el alto de la ventana; todos tienen scroll interno.
- [x] Las acciones de encabezado envuelven en lugar de desbordar.
- [x] La navegación móvil alcanza el 100 % de las rutas autorizadas — prueba que exige
      que **todo** enlace del menú quede dentro del viewport a 320 px.
- [x] `yarn lint` sin avisos · `yarn typecheck` limpio · `yarn build` correcto (69 páginas).
- [x] `yarn test:unit` **368/368** y `test:smoke` correcto — por encima de la línea base.
- [x] Sin cambios en contratos API, validaciones, rutas, permisos ni estado.

---

## 10. Decisiones que deben conservarse

1. **Identidad visual** — paleta `teal.*` remapeada, `--radius: 1rem`, Fraunces/Manrope.
2. **Tope de contenedor en 1200 px** — decisión editorial deliberada; en ultraancha se
   centra, no se estira.
3. **Cajón móvil en lugar de tira con scroll horizontal** — corrección previa
   documentada en `sidebar.tsx`; se preserva y se refuerza.
4. **Zoom sin límite** — `maximumScale` deliberadamente libre (WCAG 1.4.4).
5. **`whitespace-nowrap` en `Button`** — evita botones de dos líneas; se resuelve
   mediante envoltura del contenedor, no quitándolo.
6. **Sin librería de tablas** — `DataTable` propia; no se introduce dependencia.
7. **`useSyncExternalStore` en `useMediaQuery`** — evita desajuste de hidratación con
   `output: export`.
8. **Cortes por `prefers-reduced-motion`** — se mantienen y se extienden.

---

## 11. Suposiciones realizadas

1. **`md` (768 px) es el umbral tabla ↔ tarjetas.** Coincide con el breakpoint donde
   `PageHeader` ya pasa a fila y con la tablet vertical de la matriz.
2. **El orden de columnas indica prioridad.** La primera columna de cada tabla actúa
   como título de la tarjeta; es cierto en las 16 tablas (todas empiezan por el
   identificador de la entidad).
3. **La columna de acciones se detecta por `key: "actions"`.** Verificado en las 16; el
   nuevo campo `priority` permite marcarlo explícitamente en el futuro.
4. **Ninguna tabla exige comparación entre filas en móvil.** Son listas de gestión, no
   informes analíticos, de modo que las tarjetas no pierden información útil.
5. **Los anchos de imagen de la landing pueden reducirse por debajo de `md`.** El
   escritorio no se altera.

---

## 12. Trabajo declarado fuera de alcance

Por la regla de no cambiar el producto sin autorización, **no** se ejecuta:

- Migración masiva de `<select>` nativos a una primitiva `Select` (M2) — cosmético y de
  amplio alcance.
- División de `landing-v2-page.tsx` (1063 L) y `public-view.normalizer.ts` (1058 L).
  Superan la guía de 300 líneas, pero trocearlos es una refactorización arquitectónica
  sin efecto responsivo. Queda registrado como propuesta.
- Regresión visual automatizada con comparación de imágenes: `playwright.config.ts` ya
  captura pantallas de la landing; montar un sistema de aprobación de instantáneas es
  infraestructura nueva que el mandato desaconseja sin justificación.

# Matriz de pruebas responsivas

Fecha de ejecución: **2026-08-03** · Rama `main` · Servidor: export estático (`out/`)
servido en `http://127.0.0.1:5173`

---

## 1. Cómo reproducir

```bash
yarn install --immutable
yarn build                       # genera out/ (output: "export")
cd out && python -m http.server 5173 --bind 127.0.0.1   # o cualquier servidor estático

# En otra terminal:
E2E_BASE_URL=http://127.0.0.1:5173 npx playwright test --project=responsive
```

> El proyecto **`responsive`** de `playwright.config.ts` es obligatorio. Los perfiles de
> dispositivo (`mobile`, `tablet`) llevan `isMobile: true`, con lo que Chrome aplica su
> propia escala de meta-viewport y un `setViewportSize(320)` acaba midiendo ~257 px de
> maquetación: la matriz comprobaría anchos distintos de los declarados. El proyecto
> `responsive` conserva `hasTouch` (para los estilos de `pointer: coarse`) sin esa
> reescala.

---

## 2. Resultado global

```text
Running 124 tests using 1 worker
  124 passed (1.9m)
```

| Validación | Comando | Resultado |
|---|---|---|
| Type checking | `yarn typecheck` | ✅ limpio |
| Lint | `yarn lint` (`--max-warnings=0`) | ✅ limpio |
| Build de producción | `yarn build` | ✅ 69 páginas generadas |
| Pruebas unitarias | `yarn test:unit` | ✅ **368 / 368** en 35 suites |
| Smoke estático | `yarn test:smoke` | ✅ correcto |
| Matriz responsiva E2E | `npx playwright test --project=responsive` | ✅ **124 / 124** |

---

## 3. Matriz ancho × ruta

Criterio: `document.documentElement.scrollWidth ≤ clientWidth + 1`
(1 px de tolerancia por el redondeo subpíxel del navegador).

Cuando falla, la prueba **nombra los elementos culpables** con sus coordenadas, de modo
que el diagnóstico no exige buscarlos a mano.

| Ancho | Categoría | `/` | `/biblioteca` | `/novedades` | `/cursos` | `/login` | `/registro` | `/privacidad` | `/terminos` |
|---:|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| 320 | Móvil muy pequeño | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 344 | Intermedio | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 360 | Móvil pequeño | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 390 | Móvil estándar | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 412 | Intermedio | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 430 | Móvil grande | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 600 | Intermedio | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 768 | Tablet vertical | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 834 | Intermedio | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1024 | Tablet horizontal | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1152 | Intermedio | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1280 | Laptop | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1440 | Escritorio | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 1920 | Escritorio grande | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2560 | Ultraancha | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

**120 combinaciones ancho × ruta, todas correctas.**

---

## 4. Comprobaciones de comportamiento

| # | Prueba | Verificación | Resultado |
|---|---|---|---|
| 1 | Menú público a 320 px | Abre, **todos** sus enlaces quedan dentro del viewport, cierra con `Escape` | ✅ |
| 2 | Menú abierto sin desbordamiento | Abrirlo no introduce desplazamiento horizontal | ✅ |
| 3 | Objetivo táctil de cabecera | El botón de menú ≥ 24×24 px (WCAG 2.2 AA 2.5.8) | ✅ |
| 4 | Zoom al 200 % | Ventana de 640 px (equivalente a 1280 px al 200 %) sin desbordamiento | ✅ |

---

## 5. Cobertura unitaria de la corrección crítica

`tests/unit/data-table-responsive.test.tsx` — 10 casos, todos en verde:

| Caso | Garantía |
|---|---|
| Inferencia de prioridad (×4) | Las 16 tablas obtienen la vista móvil **sin cambios en sus pantallas** |
| Una tarjeta por fila | La vista compacta se pinta a partir de las mismas columnas |
| **Acciones operativas en la tarjeta** | El defecto central: la acción responde y recibe la fila correcta |
| Etiquetado `dl`/`dt`/`dd` | La relación etiqueta→valor deja de ser posicional y es accesible |
| `cardLabel` | Etiqueta alternativa cuando el encabezado es escueto |
| `priority: "hidden"` | Se omite de la tarjeta, permanece en la tabla |
| Sin filas | No pinta tarjetas vacías |

Complementado por `tests/unit/ui-data-table.test.tsx`, `ui-modal.test.tsx` y
`ui-button.test.tsx`, que cubren el contrato general de esas primitivas.

---

## 6. Evidencia visual

`tests/e2e/__screenshots__/responsive/` — 20 capturas (4 rutas × 5 anchos):

| Ruta | 320 | 390 | 768 | 1280 | 1920 |
|---|:-:|:-:|:-:|:-:|:-:|
| Landing | ✅ 0 px | ✅ 0 px | ✅ 0 px | ✅ 0 px | ✅ 0 px |
| Registro | ✅ 0 px | ✅ 0 px | ✅ 0 px | ✅ 0 px | ✅ 0 px |
| Login | ✅ 0 px | ✅ 0 px | ✅ 0 px | ✅ 0 px | ✅ 0 px |
| Biblioteca | ✅ 0 px | ✅ 0 px | ✅ 0 px | ✅ 0 px | ✅ 0 px |

*(desbordamiento horizontal medido en píxeles; 0 en todos los casos)*

Revisión visual de las capturas a 320 px:

- **Registro** — marca truncada con el descriptivo suprimido por debajo de 380 px según
  lo diseñado; formulario en una columna; campos y etiquetas legibles; sin recortes.
- **Biblioteca** — contenido real (titular, buscador, tarjetas) correctamente
  reorganizado; el buscador y su botón se apilan.
- **Landing** — estado de carga centrado y **contenido dentro del ancho**; antes de la
  corrección este aviso desbordaba 32 px (ver §7).

---

## 7. Condiciones adicionales verificadas

| Condición | Método | Resultado |
|---|---|---|
| Orientación horizontal | Alturas de 320–400 px en la matriz (1024×768, 640×400) | ✅ |
| Zoom 200 % | Prueba dedicada a 640 px | ✅ |
| Backend no disponible | Es el estado real del entorno de pruebas: la landing renderiza su estado de carga/error | ✅ **defecto encontrado y corregido** |
| Textos largos | Titulares editoriales reales en `/biblioteca`, `/novedades` | ✅ |
| Cadenas sin espacios | `overflow-wrap: break-word` global sobre correos, slugs y URLs | ✅ |
| Datos vacíos | `EmptyState` a través de `DataTable` (cobertura unitaria) | ✅ |
| Menú abierto | Prueba de comportamiento #2 | ✅ |
| Movimiento reducido | Cortes `prefers-reduced-motion` preexistentes, conservados y ampliados | ✅ |

---

## 8. Limitaciones declaradas

Se registran de forma explícita en lugar de presentarse como cobertura.

1. **Las rutas de portal (`/admin`, `/paciente`, `/terapeuta`) no están en la matriz
   E2E.** Están detrás de `ClientRoleGuard` y exigen una sesión con token real contra un
   backend. Su cobertura responsiva es **indirecta pero sólida**: proviene de las
   primitivas compartidas (`DataTable`, `Modal`, `PageHeader`, `TableShell`, `Card`,
   `Button`, `DashboardShell`), verificadas por pruebas unitarias y por el hecho de que
   el 100 % de esas pantallas las consume. **Recomendación:** añadir a la matriz un
   proyecto E2E autenticado cuando exista un backend de pruebas con credenciales
   sintéticas.
2. **El contenido real de la landing (`/`) no se ejercita en la matriz.** En el entorno
   de pruebas no hay backend, de modo que `/` sirve su estado de carga. Las secciones
   ricas de la landing se comprueban de forma indirecta en `/biblioteca`, `/novedades`,
   `/cursos` y `/registro`, que comparten `PublicShell` y los mismos patrones de
   sección, y que sí renderizan contenido completo.
3. **No hay comparación automatizada de imágenes.** Las capturas son evidencia para
   revisión humana. Montar un sistema de aprobación de instantáneas es infraestructura
   nueva; queda como propuesta, no ejecutada.
4. **El teclado virtual no se puede emular en Playwright de escritorio.** La mitigación
   es estructural (scroll interno en el modal en lugar de scroll de ventana, `dvh`), no
   verificada en dispositivo real.
5. **Sin verificación en dispositivos físicos ni en Safari/iOS.** Toda la matriz se
   ejecuta en Chromium. Las utilidades empleadas (`dvh`, `env(safe-area-inset-*)`,
   `overflow: clip`, `clamp()`) tienen soporte pleno en los navegadores objetivo.

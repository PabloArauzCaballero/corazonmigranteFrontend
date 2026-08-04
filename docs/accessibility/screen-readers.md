# Lectores de pantalla y contenido dinámico

- **Fecha de evidencia:** 2026-08-03

## 1. Idioma

`<html lang="es">` en [app/layout.tsx](../../src/app/layout.tsx). Es lo que permite al lector de pantalla elegir la voz y las reglas de pronunciación correctas. WCAG 3.1.1 ✅

La aplicación no tiene i18n, así que no hay contenido en otro idioma que requiera `lang` a nivel de elemento (WCAG 3.1.2 no aplica hoy).

## 2. Estructura semántica

| Elemento | Implementación | Estado |
|---|---|---|
| `<main>` | En ambos shells, con `id="contenido-principal"` | ✅ |
| `<h1>` | Generado por `PageHeader` en casi toda pantalla de portal | ✅ |
| Navegación | En `PublicShell` y `DashboardShell` | ⚠️ No verificado si usan `<nav>` con nombre accesible |
| Jerarquía `h1→h2→h3` | Depende de cada pantalla | ⚠️ No verificada |
| Tablas | `DataTable` genera `<table>`, `<thead>`, `<th>` | ⚠️ `scope="col"` y `<caption>` no verificados |

`PageHeader` es la pieza clave: al renderizar el `<h1>`, cualquier pantalla que lo use tiene un encabezado de nivel 1 correcto. Es también la razón por la que conviene usarlo siempre en vez de escribir un `<h1>` a mano.

## 3. Regiones dinámicas (live regions)

Cinco archivos usan `aria-live`, `role="alert"` o `role="status"`:

| Archivo | Uso |
|---|---|
| `shared/ui/toast.tsx` | Avisos, con urgencia diferenciada |
| `shared/ui/global-loading-bar.tsx` | Progreso global |
| `features/auth/login-form.tsx` | Errores de autenticación |
| `features/tutorial/ui/tutorial-tooltip.tsx` | Paso actual del tutorial |
| `features/tutorial/ui/tutorial-tour.tsx` | Recorrido guiado |

### El tratamiento de `toast` es ejemplar

```tsx
role={isUrgent ? "alert" : "status"}
aria-live={isUrgent ? "assertive" : "polite"}
aria-atomic="true"
```

donde `isUrgent = variant === "danger" || variant === "warning"`.

Comentario del código: *«Solo los avisos de error interrumpen al lector de pantalla; el resto se anuncian cuando la persona termina lo que esté leyendo.»*

Es el criterio correcto. `assertive` interrumpe la lectura en curso; usarlo para un «Guardado correctamente» es una de las causas más comunes de que la gente desactive los anuncios.

`aria-atomic="true"` hace que se lea el aviso completo y no solo la parte que cambió.

## 4. Elementos decorativos

Todos los iconos de `lucide-react` en `state.tsx`, `button.tsx` y `data-table.tsx` llevan `aria-hidden="true"`. Es correcto: son redundantes con el texto adyacente y sin ese atributo el lector anunciaría nombres de iconos sin sentido.

## 5. Estados anunciados

| Estado | Anuncio |
|---|---|
| Botón cargando | `aria-busy` en `Button` |
| Diálogo abierto | `aria-labelledby` + `aria-describedby` con `useId()` |
| Sin resultados | Texto de `EmptyState`, no solo un icono |
| Acceso denegado | Texto de `ForbiddenState` |
| Verificando sesión | Texto de `LoadingState` |

Que los cuatro estados de `state.tsx` sean **texto** y no solo iconografía es lo que los hace accesibles sin trabajo adicional.

## 6. Puntos débiles

| # | Punto | Impacto |
|---|---|---|
| 1 | `Badge` es un `<div>` sin rol ni texto alternativo | Aceptable **mientras** el texto comunique el estado. Un badge solo de color incumpliría WCAG 1.4.1 |
| 2 | Jerarquía de encabezados no verificada dentro de las pantallas | Un salto `h1 → h3` dificulta la navegación por encabezados |
| 3 | `scope` y `<caption>` en tablas no verificados | Sin `scope="col"`, las celdas pierden su asociación de cabecera |
| 4 | Nombres accesibles de `<nav>` no verificados | Con dos navegaciones en pantalla (lateral y superior), sin `aria-label` se anuncian igual |
| 5 | Overlay de tutoriales sin probar con lector | Es contenido que aparece sobre la pantalla: si no se anuncia, resulta invisible |

Todos recogidos dentro de `A11Y-04`, `A11Y-06` y `A11Y-07`.

## 7. Verificación recomendada

| Lector | Plataforma | Navegador |
|---|---|---|
| NVDA | Windows | Firefox |
| JAWS | Windows | Chrome |
| VoiceOver | macOS | Safari |
| VoiceOver | iOS | Safari |
| TalkBack | Android | Chrome |

Mínimo razonable: NVDA + Firefox y VoiceOver + Safari cubren la mayor parte de los patrones de fallo.

**Journeys a probar primero:** iniciar sesión, reservar una cita, consultar las citas propias. Son los tres que una persona usuaria realiza sola y sin ayuda.

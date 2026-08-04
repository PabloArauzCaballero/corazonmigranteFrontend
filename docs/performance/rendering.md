# Rendimiento de renderizado

- **Fecha de evidencia:** 2026-08-03

## 1. Modelo de renderizado

Todo el HTML se genera **en build** y se hidrata en el navegador. Detalle en [../architecture/rendering-strategy.md](../architecture/rendering-strategy.md).

Implicaciones para el rendimiento:

| Fase | Coste | Comentario |
|---|---|---|
| Entrega del HTML | **Muy bajo** | Estático desde el borde de Cloudflare |
| Descarga del JS | 100–194 kB | Ver [bundle-analysis.md](bundle-analysis.md) |
| Hidratación | Proporcional al árbol | Todos los providers se montan en cada carga |
| Primera carga de datos | Tras la hidratación | **Ninguna pantalla privada muestra datos antes de hidratar** |

La última fila es la característica que más define la experiencia: en una ruta guardada, la secuencia es HTML → hidratación → lectura de `localStorage` → `LoadingState` → petición → datos. Es inevitable con esta arquitectura, y la razón de que `LoadingState` y los `loading.tsx` estén tan presentes.

## 2. Estados de carga como herramienta de rendimiento percibido

| Mecanismo | Dónde | Efecto |
|---|---|---|
| `loading.tsx` | 11 rutas | Fallback inmediato durante la navegación |
| `DataTableSkeleton` | Tablas | Esqueleto con la forma de la tabla real |
| `LoadingState` | Guard y cargas de datos | Estado explícito |
| `GlobalLoadingBar` | Global | Progreso general |
| `SmartImage` shimmer | Imágenes | Evita huecos vacíos |

`DataTableSkeleton` merece mención: usa anchos de celda variables y `animation-delay` escalonado por celda. Un esqueleto con todas las celdas idénticas y sincronizadas se percibe como un error de render, no como carga.

## 3. Providers y coste de hidratación

Seis providers se montan en **todas** las rutas:

```
QueryClientProvider → SessionProvider → TelemetryProvider → GlobalLoadingBar
→ ToastProvider → ConfirmProvider → TutorialProvider
```

Todos son necesarios globalmente: sesión y toasts en cualquier pantalla, tutoriales por encima de cualquier ruta, telemetría desde la primera navegación.

`TelemetryProvider` **no renderiza nada** — solo conecta efectos. Su coste de render es nulo; el de sus efectos, bajo.

## 4. Patrones de optimización presentes en el código

### `SmartImage` — estado derivado durante el render

```ts
const [lastResolved, setLastResolved] = useState(resolved);
if (resolved !== lastResolved) {
  setLastResolved(resolved);
  setCurrent(resolved);
  setStatus("loading");
}
```

Es la técnica oficial de React para estado derivado de props, y aquí resuelve un problema visible que el comentario documenta: con `useEffect` había un render intermedio en el que **se veía la imagen anterior durante un frame**.

### Clave de consulta compartida en notificaciones

`UNREAD_COUNT_KEY` se comparte entre la campana de escritorio y la de móvil. El comentario del código explica el antes: dos `useState` con carga inicial propia que hacían **dos peticiones** y provocaban un render en cascada.

Es el patrón general: mover estado de servidor de `useState + useEffect` a React Query elimina renders en cascada y peticiones duplicadas.

### `retry: 1` y `staleTime: 30 s`

`staleTime` evita refetches al remontar o volver a enfocar la ventana. `retry: 1` evita que un backend caído cuadruplique la carga.

### El lint bloquea el build

`eslint.ignoreDuringBuilds: false`, con este comentario en `next.config.ts`:

> *«ya no hay deuda pendiente de react-hooks y dejarlo desactivado permitía que llegaran a producción errores reales (renders en cascada, componentes recreados en cada render, enlaces internos con `<a>`).»*

Las tres cosas que enumera son problemas de rendimiento, y `eslint-plugin-react-hooks@7.1.1` los detecta. **El lint es aquí una herramienta de rendimiento, no solo de estilo.**

## 5. Riesgos

| # | Riesgo | Severidad | Detalle |
|---|---|---|---|
| 1 | Ruta pesada = ruta más visitada | Medio | `/` con 194 kB |
| 2 | Nueve rutas admin arrastran 186 kB por un chunk común | Bajo | Bien factorizado, pero amplio |
| 3 | Coste de OpenTelemetry sin medir | Medio | `PERF-03` |
| 4 | Sin virtualización en listas largas | Bajo | `DataTable` pagina; no se detectó ninguna lista sin paginar |
| 5 | Memoización no auditada | Bajo | No se revisó el uso de `useMemo`/`useCallback` |

Sobre el punto 5: la memoización innecesaria tiene coste propio. El lint con `react-hooks` cubre las dependencias incorrectas, que es el fallo grave; el exceso de memoización es una cuestión de estilo y no se audita aquí.

## 6. Qué NO hacer para ganar rendimiento

Ver [budgets.md §4](budgets.md). En particular: no eliminar la lógica de foco del `Modal`, el saneado de telemetría ni las fronteras de error. Ninguna de las tres pesa lo suficiente como para justificar su pérdida.

# Build

- **Fecha de evidencia:** 2026-08-03

## 1. Comando y fases

```bash
yarn build     # → next build con output: "export"
```

| Fase | Qué ocurre | Puede fallar por |
|---|---|---|
| 1. Compilación | Webpack compila TypeScript y CSS | Error de sintaxis o importación |
| 2. **Lint y tipos** | ESLint + `tsc` | `eslint.ignoreDuringBuilds: false` → **el lint bloquea** |
| 3. Recolección de datos de página | Lee `metadata` y `generateStaticParams` | Backend inaccesible en `/[slug]` |
| 4. Generación estática | 69 páginas | Uso de `window` en render |
| 5. Exportación | Escribe `out/` | Contención sobre `.next/` |

Duración medida: **~60 s** en Windows con Node 22.

## 2. El lint bloquea el build, a propósito

```ts
eslint: { ignoreDuringBuilds: false }
```

Comentario del código:

> *«El lint vuelve a bloquear el build: ya no hay deuda pendiente de react-hooks y dejarlo desactivado permitía que llegaran a producción errores reales (renders en cascada, componentes recreados en cada render, enlaces internos con `<a>`).»*

Los tres problemas que enumera son de rendimiento y de corrección. **Aquí el lint es una herramienta de calidad de producto, no de estilo.**

Consecuencia práctica: no se puede desplegar con un error de lint. Es deliberado y no debe revertirse por conveniencia.

## 3. Salida esperada

```
✓ Compiled successfully
✓ Generating static pages (69/69)
✓ Exporting (3/3)

Route (app)      Size   First Load JS
┌ ○ /          28.3 kB      194 kB
…
+ First Load JS shared by all       100 kB
```

Verificaciones sobre la tabla:

- **69** rutas.
- `First Load JS shared` dentro del presupuesto de [../performance/budgets.md](../performance/budgets.md).
- `Exporting (3/3)` presente — si falta, la exportación no se completó.

## 4. Artefacto

`out/`. **`.next/` es intermedio y no se despliega** — ver el problema `OPS-02` en [deployment.md §4](deployment.md).

Comprobación imprescindible tras cada build:

```bash
ls -la out/_headers out/index.html
```

## 5. Problema conocido: builds concurrentes

Dos procesos `next build` sobre el mismo `.next/` fallan con `ENOENT` en los manifiestos. **Reproducido el 2026-08-03.** Runbook: [runbooks/build-manifest-enoent.md](runbooks/build-manifest-enoent.md).

Regla: **un único build a la vez**, y `rm -rf .next out` ante cualquier duda.

## 6. Reproducibilidad

| Control | Estado |
|---|---|
| `yarn.lock` versionado | ✅ |
| `packageManager: yarn@4.9.2` | ✅ |
| `engines: node >=20.18.0` | ✅ |
| `yarn install --frozen-lockfile` en CI | ✅ |
| Salida determinista | ✅ Mismos hashes con las mismas entradas |
| **Variables incrustadas en build** | ⚠️ El artefacto depende del entorno de build |

La última fila implica que **el mismo commit produce artefactos distintos según las variables**. Es intrínseco a `NEXT_PUBLIC_*` y la razón de que un cambio de configuración exija reconstruir.

## 7. Otros comandos

```bash
yarn dev          # desarrollo, puerto 4173 con auto-selección
yarn typecheck    # tsc --noEmit
yarn lint         # eslint . --max-warnings=0
yarn test:ci      # lint + typecheck + unit + smoke
```

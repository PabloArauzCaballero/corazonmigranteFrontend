# Runbook — El build falla con `ENOENT` sobre manifiestos

> **Incidente real reproducido el 2026-08-03 durante la construcción de la línea base.** Los pasos siguientes son los que lo resolvieron.

## Síntoma

`yarn build` compila correctamente y falla después:

```
✓ Compiled successfully in 17.0s
   Linting and checking validity of types ...
   Collecting page data ...

> Build error occurred
[Error: ENOENT: no such file or directory, open '.next\build-manifest.json']
```

Variantes observadas del mismo fallo:

```
ENOENT ... open '.next\server\pages-manifest.json'
ENOENT ... stat  '.next\cache\webpack\client-production\3.pack'
> Could not find a production build in the '.next' directory
```

## Impacto

- No se puede desplegar.
- **Puede dar un código de salida `0` engañoso** si el comando se envuelve (por ejemplo con `time` o en segundo plano), lo que hace que un pipeline lo interprete como éxito.

## Causa raíz

**Dos o más procesos `next build` compitiendo por el mismo directorio `.next/`.** Uno lo limpia mientras el otro lee sus manifiestos.

Origen habitual: un build anterior que no terminó de salir, un `next dev` activo en segundo plano, o dos comandos lanzados en paralelo.

Causa secundaria posible: antivirus o sincronización de carpetas (OneDrive) bloqueando archivos en `.next/`. Es más probable en Windows.

## Diagnóstico seguro

```bash
# ¿Hay procesos de build vivos?
# Windows (PowerShell):
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Select-Object ProcessId, CommandLine |
  Where-Object { $_.CommandLine -match 'next|yarn build|tsc' }

# Linux / macOS:
ps aux | grep -E 'next build|yarn build' | grep -v grep
```

Comprobar si `.next/` está incompleto:

```bash
ls -la .next/build-manifest.json .next/server/pages-manifest.json
```

## Evidencia a recoger

- Salida completa del build.
- Lista de procesos node activos.
- Contenido de `.next/` y `.next/server/`.
- Si es en CI: si hay más de un job construyendo sobre el mismo espacio de trabajo.

## Mitigación

```bash
# 1. Terminar procesos de build huérfanos
#    (PowerShell)  Stop-Process -Id <PID> -Force
#    (Unix)        kill -9 <PID>

# 2. Eliminar los artefactos (ambos están en .gitignore: es seguro)
rm -rf .next out

# 3. Reconstruir EN SERIE, sin nada más en paralelo
yarn build
```

**No ejecutar `yarn typecheck` ni `yarn lint` a la vez que el build**: `next build` ya hace ambas cosas internamente, y lanzarlas en paralelo agrava la contención.

## Verificación

El build debe terminar con la tabla de rutas y `Exporting (3/3)`:

```
✓ Generating static pages (69/69)
 ✓ Exporting (3/3)
Route (app)   Size   First Load JS
...
```

Y comprobar el artefacto:

```bash
ls out/index.html out/_headers
```

## Rollback

No aplica: no se ha modificado nada. `.next/` y `out/` son artefactos regenerables e ignorados por git.

## Prevención

1. Un único build a la vez.
2. En CI, no compartir espacio de trabajo entre jobs que construyan.
3. Capturar el código de salida de `yarn build` **directamente**, sin envolverlo en otro comando que pueda enmascararlo.
4. Ante cualquier duda sobre el estado de `.next/`: `rm -rf .next out` antes de construir. Cuesta unos segundos de compilación y elimina toda una clase de fallos.

## Escalado

Si persiste tras un `.next/` limpio y sin procesos concurrentes, sospechar del antivirus o de la sincronización de carpetas. Excluir el directorio del proyecto de ambos y repetir.

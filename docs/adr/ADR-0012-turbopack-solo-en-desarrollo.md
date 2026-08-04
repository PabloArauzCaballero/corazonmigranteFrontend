# ADR-0012: Turbopack en desarrollo, webpack en el build de producción

- **Fecha:** 2026-08-03
- **Estado:** Aceptada

## Contexto

Next 15.4 permite usar Turbopack tanto en `next dev --turbopack` como en `next build --turbopack`. Se midieron ambos en este proyecto (Windows 11, Node 22.23.1, caché borrada entre medidas).

### Desarrollo

| Medida | webpack | Turbopack | Diferencia |
|---|---|---|---|
| Arranque (`Ready in`) | 2,4 s | 2,6 s | comparable |
| Primera compilación de `/login` | 15,8 s (1580 módulos) | 6,9 s | **2,3× más rápido** |
| Primera compilación de `/admin/usuarios` | 2,5 s (1694 módulos) | 1,19 s | **2,1× más rápido** |

El arranque en frío es equivalente; la ganancia real está en compilar cada ruta, que es lo que se paga cada vez que se navega a una pantalla nueva durante el desarrollo.

### Build de producción

`next build --turbopack` **completa correctamente** en este proyecto, incluida la exportación estática. Pero Next emite estos avisos:

> Support for Turbopack builds is experimental. We don't recommend deploying mission-critical applications to production.
>
> Turbopack currently always builds production source maps for the browser. This will include project source code if deployed to production.

El segundo es el determinante: publicaría el código fuente del panel administrativo junto al artefacto estático. En un producto que maneja datos de salud y migración, eso entrega gratis la superficie de ataque del cliente.

## Decisión

- **`yarn dev` usa Turbopack.** `scripts/dev-auto-port.mjs` añade `--turbopack`. Se puede desactivar con `NEXT_DISABLE_TURBOPACK=1` para comparar o diagnosticar.
- **`yarn build` sigue en webpack.** Sin `--turbopack`, sin configuración paralela.

No se mantiene ninguna configuración específica de bundler: `next.config.ts` no tiene bloque `webpack` ni `turbopack`, así que ambos leen exactamente la misma configuración y no hay dos verdades que sincronizar.

## Consecuencias

- El bundle que se despliega lo produce el compilador estable y sin source maps del cliente.
- Desarrollo y producción usan compiladores distintos: una incompatibilidad podría aparecer solo en el build. Se mitiga porque el build de producción se ejecuta en CI en cada push y PR (`.github/workflows/ci.yml`), no solo al desplegar.

## Cuándo revisar

Cuando Next marque el build con Turbopack como estable y deje de generar source maps de producción por defecto (seguimiento en la discusión 77721 de `vercel/next.js`), conviene volver a medir y, si el artefacto es equivalente, unificar ambos en Turbopack.

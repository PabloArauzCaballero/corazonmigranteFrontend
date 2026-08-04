# ADR-0002: Exportación estática con `output: "export"`

## Estado

**Aceptado** — documenta el estado observado el 2026-08-03.

> Este ADR se escribe **a posteriori**. No existe registro histórico de la deliberación original; documenta la decisión tal como está implementada y sus consecuencias verificables. No se atribuyen razonamientos que no consten en el código o la configuración.

## Contexto

El frontend se despliega en **Cloudflare Pages**, una plataforma de alojamiento estático con soporte para Functions. `next.config.ts` declara `output: "export"`, de modo que `next build` produce HTML, CSS y JS estáticos en `out/` en lugar de una aplicación servidor.

## Fuerzas y restricciones

- Cloudflare Pages sirve contenido estático desde el borde: coste bajo, alta disponibilidad, latencia mínima.
- La autoridad de datos y autorización es un backend NestJS **independiente**, en otro origen.
- El frontend no necesita renderizar datos privados en servidor: cada persona consulta los suyos con su JWT.
- No hay requisito de SEO sobre contenido personalizado.

## Opciones consideradas

| Opción | Ventajas | Inconvenientes |
|---|---|---|
| **Exportación estática** (elegida) | Coste mínimo, sin servidor que mantener, entrega desde el borde, superficie de ataque reducida | Sin middleware, sin Route Handlers, sin cookies `HttpOnly`, sin optimización de imágenes |
| Next.js con servidor Node | Middleware, RSC con datos, cookies `HttpOnly`, `headers()` | Servidor que operar, escalar y asegurar |
| SPA pura (Vite + React Router) | Simplicidad | Se pierde el App Router, el prerenderizado y el ecosistema Next |

## Decisión

Exportar estáticamente y delegar **toda** decisión de seguridad sobre datos al backend.

## Consecuencias positivas

- **Sin servidor de aplicación que comprometer.** El HTML es público por diseño: no hay lógica de negocio que filtrar.
- Entrega desde el borde: TTFB y FCP muy favorables.
- Coste de infraestructura mínimo y despliegue trivial.
- **Rollback inmediato** sin reconstruir — la herramienta de contención principal de casi todos los incidentes.
- Modelo mental simple: un único origen de verdad para los datos.

## Consecuencias negativas

| Consecuencia | Mitigación aplicada |
|---|---|
| `middleware.ts` **no se ejecuta** | `ClientRoleGuard` en los tres layouts privados |
| Route Handlers `/api/*` no se exportan | Cloudflare Pages Function para telemetría; `/api/debug-log` limitado a desarrollo |
| `headers()` no disponible | [public/_headers](../../public/_headers) |
| **Sin cookies `HttpOnly`** para el JWT | `localStorage` + CSP `script-src 'self'` + sin scripts de terceros |
| Sin optimización de imágenes de Next | `SmartImage` + Cloudinary |
| El contenido CMS no se refresca solo | `generateStaticParams` en build + `FALLBACK_PUBLIC_SLUGS` |
| Local y producción se comportan distinto | Documentado en [operations/environments.md §2](../operations/environments.md) |

## Riesgos

| Riesgo | Severidad |
|---|---|
| El JWT en `localStorage` es accesible a cualquier script (`SEC-03`) | HIGH — **aceptado** |
| Las tres asimetrías local/producción producen fallos que solo aparecen desplegados | MEDIUM |
| **El frontend no puede proteger ningún dato**: si un endpoint del backend no valida el rol, no hay defensa | Depende íntegramente del backend |

El último no es un riesgo de esta decisión, sino su premisa. Toda la seguridad de datos recae en el backend, y conviene que ambos equipos lo tengan explícito.

## Evidencia

- [next.config.ts](../../next.config.ts) — `output: "export"`
- Salida de `next build` (2026-08-03): 69 rutas, `Exporting (3/3)`
- Verificado: `out/api/` **no existe**
- [middleware.ts:1-15](../../middleware.ts) — la cabecera documenta que no se ejecuta
- [guard.tsx:9-21](../../src/shared/auth/guard.tsx) — «este componente es la ÚNICA protección efectiva»
- [public/_headers](../../public/_headers) — cabeceras fuera de `next.config.ts`
- [functions/otel/v1/traces.ts](../../functions/otel/v1/traces.ts)

## Plan de revisión

Revisar si: se necesita renderizado en servidor de contenido personalizado; el SEO exige contenido dinámico; se decide que el JWT debe vivir en cookie `HttpOnly`; o el contenido CMS necesita publicarse sin reconstruir.

**Coste estimado del cambio: alto.** Retirar `output: "export"` activa el middleware (con la divergencia de roles `SEC-02` sin resolver), obliga a migrar `_headers` a `headers()`, duplica la Pages Function con los Route Handlers y exige nueva línea base completa. Ver [architecture/rendering-strategy.md §7](../architecture/rendering-strategy.md).

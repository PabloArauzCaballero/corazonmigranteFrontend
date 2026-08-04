# ADR-0009: Tipos manuales sin OpenAPI

## Estado

**Aceptado por omisión** — no consta una decisión deliberada. Se documenta el estado observado el 2026-08-03 y sus consecuencias.

## Contexto

El backend es NestJS, que puede generar OpenAPI con `@nestjs/swagger`. El frontend consume ~70 URLs únicas declaradas en `ENDPOINTS`.

**No existe especificación OpenAPI en el repositorio del frontend, ni tipos generados, ni herramienta de generación.** Todos los tipos (`users.types.ts`, `landing-v2.types.ts`, `NormalizedSession`, etc.) están escritos a mano.

## Opciones que existían

| Opción | Estado |
|---|---|
| **Tipos manuales** (actual) | ✅ En uso |
| `openapi-typescript` sobre el OpenAPI del backend | ❌ No adoptada |
| Cliente generado completo (`orval`, `openapi-generator`) | ❌ No adoptada |
| Esquemas zod compartidos entre front y back | ❌ No adoptada |

## Consecuencias positivas

- Sin paso de generación en el build ni dependencia del backend para compilar.
- Los tipos se ajustan a lo que el frontend **necesita**, no a lo que el backend expone.
- Sin acoplamiento a una versión concreta de la especificación.

## Consecuencias negativas

**Un cambio en el backend solo se descubre cuando algo falla.** No hay verificación en tiempo de compilación de que los tipos correspondan a la realidad.

La única verificación real es `tests/integration/backend-contract.test.ts`, que exige un backend accesible y **no se ejecuta en CI**.

### La compensación existente

El proyecto ha desarrollado defensas notables en el cliente:

| Defensa | Qué absorbe |
|---|---|
| `normalizeSession()` | Envoltorios, nombres de rol, ubicación del token, banderas heredadas |
| `normalizePaginatedResponse()` | Distintas formas de paginación |
| `isRecord()`, `getString()` | Accesos a campo sin garantía |
| Reintento por `property X should not exist` | Validación estricta de NestJS |
| `pruneOptionalEmptyValues()` | Cadenas vacías en campos opcionales |
| `extractErrorMessage()` | Formas heterogéneas de error |
| Normalizadores por feature | Variabilidad de cada dominio |

**Cinco de los diez nodos más conectados del grafo pertenecen a esta capa defensiva.** Es una inversión considerable, y explica por qué el sistema tolera bien la variabilidad del backend.

Pero es una mitigación **reactiva**: convierte un fallo en un comportamiento degradado, no lo previene. Y tiene un coste oculto — el reintento por validación hace que algunas peticiones tarden el doble, lo que se instrumentó precisamente porque era invisible.

## Riesgos

| Riesgo | Severidad |
|---|---|
| Un campo renombrado en el backend rompe una pantalla sin aviso previo | **HIGH** |
| Un tipo del frontend diverge de la realidad sin que nadie lo note | HIGH |
| El reintento por validación enmascara incompatibilidades reales | MEDIUM |
| `token` opcional en `sessionSchema` permite sesiones sin token → bucle de login | MEDIUM |

El último es un caso concreto y verificable: si el backend renombra el campo del token y `normalizeSession()` no lo reconoce, se crea una sesión válida **sin token**, el guard deja pasar y cada petición devuelve `401`. Ver [runbooks/autenticacion-en-bucle.md](../operations/runbooks/autenticacion-en-bucle.md).

## Evidencia

- Sin archivo OpenAPI ni script de generación en el repositorio
- `ENDPOINTS`: ~110 claves declaradas a mano
- Los normalizadores y su centralidad en Graphify
- `tests/integration/backend-contract.test.ts` — no incluido en `test:ci`

## Plan de revisión

Registrado como brecha `API-02`, severidad **HIGH**.

Adoptar `openapi-typescript` sobre el OpenAPI del backend cerraría el riesgo con esfuerzo moderado, **siempre que el backend publique y mantenga la especificación**. Es la condición previa, y no depende del frontend.

Mientras tanto, la mitigación de menor coste es **ejecutar `backend-contract.test.ts` en CI contra un entorno de pruebas**, lo que convertiría la deriva en un fallo de pipeline en vez de un fallo en producción.

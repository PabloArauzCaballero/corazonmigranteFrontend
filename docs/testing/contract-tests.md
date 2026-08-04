# Pruebas de contrato

- **Fecha de evidencia:** 2026-08-03

## 1. Lo que existe

Una única suite: [tests/integration/backend-contract.test.ts](../../tests/integration/backend-contract.test.ts).

```bash
yarn test:integration:backend
```

**Requiere un backend NestJS accesible** y **no se ejecuta en CI**.

## 2. Lo que no existe

| Elemento | Estado | Consecuencia |
|---|---|---|
| Especificación OpenAPI | ❌ | No hay contrato compartido |
| Tipos generados | ❌ | Los ~70 endpoints se tipan a mano |
| Pruebas de contrato en CI | ❌ | La deriva se descubre en producción |
| Pruebas dirigidas por consumidor (Pact) | ❌ | — |
| Simulación de servidor (MSW) | ❌ | Las pruebas unitarias simulan `fetch` a mano |

Brecha `API-02`, severidad **HIGH**. Ver [ADR-0009](../adr/ADR-0009-tipos-manuales-sin-openapi.md).

## 3. La defensa actual: normalización en el cliente

En ausencia de contrato verificable, el proyecto absorbe la variabilidad del backend con una capa defensiva notable:

| Defensa | Qué absorbe | Prueba |
|---|---|---|
| `normalizeSession()` | Envoltorios, nombres de rol, ubicación del token | ✅ `session.test.ts` |
| `normalizePaginatedResponse()` | Formas de paginación | ✅ `normalizers.test.ts` |
| `isRecord()`, `getString()` | Accesos a campo sin garantía | ✅ `normalizers.test.ts` |
| Reintento por validación | `property X should not exist` de NestJS | ✅ `api-client.test.ts` |
| `pruneOptionalEmptyValues()` | Cadenas vacías en campos opcionales | ✅ `api-client.test.ts` |
| `extractErrorMessage()` | Formas heterogéneas de error | ✅ `api-client.test.ts` |
| Normalizadores por feature | Variabilidad de cada dominio | ✅ `public-view-*`, `editorial-normalizer` |

**Todas tienen prueba unitaria.** Es la parte mejor cubierta del proyecto, y no es casualidad: es donde el equipo ha sufrido la variabilidad del backend.

Pero conviene ser preciso sobre qué protege: estas pruebas verifican que **los normalizadores hacen lo que se espera de ellos**, no que las respuestas reales del backend sigan teniendo la forma esperada. Convierten un fallo en un comportamiento degradado; no lo previenen.

## 4. El caso concreto que más preocupa

`sessionSchema` declara `token: z.string().min(1).optional()`.

Si el backend renombra el campo del token y `normalizeSession()` no lo reconoce entre `token`, `access_token` y `accessToken`, se crea una sesión **válida sin token**. El guard deja pasar, y cada petición devuelve `401`: bucle de login.

**Ninguna prueba lo detectaría**, porque `session.test.ts` prueba las formas conocidas, no las futuras. Ver [../operations/runbooks/autenticacion-en-bucle.md](../operations/runbooks/autenticacion-en-bucle.md).

## 5. Propuestas ordenadas por coste

| # | Acción | Coste | Efecto |
|---:|---|---|---|
| 1 | **Ejecutar `backend-contract.test.ts` en CI** contra un entorno de pruebas | Bajo | Convierte la deriva en fallo de pipeline en vez de fallo en producción |
| 2 | Que el backend publique su OpenAPI | Bajo (para el frontend) | Habilita todo lo demás |
| 3 | `openapi-typescript` para generar tipos | Medio | Deriva detectada en `yarn typecheck` |
| 4 | MSW con fixtures derivados del OpenAPI | Medio | Pruebas de componente realistas |
| 5 | Pruebas dirigidas por consumidor | Alto | El backend no puede romper al frontend sin enterarse |

**La acción 1 es la de mejor retorno inmediato** y no depende de que el backend haga nada nuevo: la suite ya existe.

La acción 2 es la condición previa de 3, 4 y 5, y **no depende del frontend**. Es la conversación pendiente entre ambos equipos.

## 6. Regla mientras tanto

Todo campo nuevo que llegue del backend debe leerse a través de `isRecord()` / `getString()` o de un normalizador con prueba. **Nunca acceder directamente a una propiedad de una respuesta sin verificar su tipo.**

Es lo que hoy evita que un cambio del backend produzca una pantalla en blanco en vez de un dato ausente.

# ADR-0003: Protección de rutas en el cliente

## Estado

**Aceptado** — consecuencia directa de [ADR-0002](ADR-0002-exportacion-estatica.md).

## Contexto

Con `output: "export"`, Next.js **no ejecuta `middleware.ts`**: no hay runtime de servidor. Hacía falta un mecanismo que impidiera que alguien sin la sesión adecuada viera la interfaz de un portal ajeno.

## Fuerzas y restricciones

- El HTML de los portales es estático y **descargable sin sesión**: no se puede impedir el acceso al archivo.
- El backend valida el JWT en cada endpoint: los **datos** ya están protegidos.
- Lo que faltaba proteger era la **experiencia**: evitar que alguien aterrice en una pantalla que no le corresponde y reciba una cascada de errores.

## Opciones consideradas

| Opción | Viabilidad |
|---|---|
| **`ClientRoleGuard` en los layouts** (elegida) | ✅ Funciona con export estático |
| `middleware.ts` | ❌ No se ejecuta |
| Comprobación en cada página | ⚠️ Funciona, pero se olvida al añadir rutas |
| Sin protección de interfaz | ⚠️ Los datos seguirían seguros, pero la experiencia sería mala |

## Decisión

Un componente `ClientRoleGuard` aplicado en el layout de cada portal:

```tsx
<ClientRoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "CONTADOR"]} loginPath="/admin/login">
  <DashboardShell …>{children}</DashboardShell>
</ClientRoleGuard>
```

Se conserva `middleware.ts` sin ejecutarse, por dos razones que el propio archivo declara: seguiría siendo la protección real en un despliegue con servidor, y documenta en un solo sitio el mapa ruta → roles.

## Consecuencias positivas

- **Una ruta nueva bajo `admin/`, `paciente/` o `terapeuta/` hereda la protección automáticamente.** Es la propiedad más valiosa.
- Estados explícitos: `LoadingState` mientras se lee la sesión, `ForbiddenState` si el rol no encaja.
- Preserva el destino con `?next=`.
- Se combina con `handleUnauthorizedSession()`, que cubre el caso del token caducado — el guard solo comprueba el rol, no la vigencia.

## Consecuencias negativas

- **No protege datos.** El código lo dice explícitamente: *«Esto protege la interfaz, no los datos: el HTML estático es público por definición.»*
- Requiere hidratar antes de decidir: hay un instante de `LoadingState` en cada carga de ruta privada.
- **Obliga a mantener dos sitios sincronizados** — y hoy **no lo están**: `middleware.ts` admite `TERAPEUTA` en `/admin` y el guard no (`SEC-02`).
- Una ruta privada creada fuera de los tres árboles **queda sin protección alguna**.

## Riesgos

| Riesgo | Severidad |
|---|---|
| Divergencia entre middleware y guard (`SEC-02`) | MEDIUM — sin impacto hoy; degradaría la defensa en profundidad si se migrara a servidor |
| Una ruta privada fuera de los tres árboles | MEDIUM — depende de la disciplina del equipo |
| Confundir el guard con un control de seguridad | **HIGH si ocurre** — mitigado con documentación explícita en el código y en este portal |

El tercero es el riesgo real: alguien podría asumir que ocultar una pantalla equivale a protegerla, y omitir la validación de rol en un endpoint nuevo del backend.

## Evidencia

- [guard.tsx](../../src/shared/auth/guard.tsx) — implementación y comentario
- [middleware.ts](../../middleware.ts) — cabecera de 15 líneas explicando por qué no se ejecuta
- Los tres layouts privados con sus `allowedRoles`
- [routes/route-catalog.md §8](../routes/route-catalog.md) — la divergencia registrada

## Plan de revisión

Revisar si se retira `output: "export"`. En ese momento el middleware volvería a ejecutarse y **habría que alinear los roles antes** de desplegar.

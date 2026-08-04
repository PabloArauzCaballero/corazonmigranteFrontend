# Propiedad y responsabilidades

- **Fecha de evidencia:** 2026-08-03

## 1. Estado real

> ⚠️ **El repositorio no define propietarios.** No existe `CODEOWNERS`, ni asignación de áreas, ni roles de guardia, ni contactos de escalado. Este documento describe **qué áreas necesitan propietario** y por qué; asignar nombres es una decisión de la organización, no del código.

Único dato disponible: el autor de los commits recientes es **Pablo Arauz Caballero**.

## 2. Áreas que requieren propietario

| Área | Alcance | Por qué necesita propietario |
|---|---|---|
| **Autenticación y RBAC** | `shared/auth/`, `middleware.ts`, `guard.tsx` | Un cambio aquí afecta a quién ve qué. La divergencia `SEC-02` existe precisamente por falta de revisión conjunta |
| **Cliente API y contratos** | `shared/api/`, `*.api.ts` | `apiRequest()` es el único punto de salida; sin OpenAPI (`API-02`), la coherencia depende de personas |
| **Sistema de diseño** | `shared/ui/`, `globals.css`, `tailwind.config.ts` | 18 de 19 componentes sin prueba (`TEST-02`) |
| **Observabilidad y privacidad** | `src/observability/` | `ALLOWED_ATTRIBUTE_KEYS` es la barrera entre diagnóstico y fuga de datos de salud |
| **Seguridad de despliegue** | `public/_headers`, `functions/`, `ci.yml` | Ampliar la CSP o tocar el pipeline son decisiones de seguridad |
| **Configuración** | `config/env.ts`, `.env.example`, panel de Cloudflare | `OPS-01`: cuatro variables del pipeline son obsoletas y nadie lo detectó |
| **Documentación** | `docs/` | Sin propietario, se desactualiza |

## 3. Contactos ausentes y su impacto

| Rol | Estado | Impacto de la ausencia |
|---|---|---|
| Propietario del frontend | Sin definir | — |
| **Propietario del backend** | Sin definir | Bloquea `SEC-01`, `API-02`, `SEC-06`: todas requieren al backend |
| **Responsable legal / protección de datos** | Sin definir | Bloquea `PRIV-02` (consentimiento) y la notificación en caso de brecha |
| **Acceso a Cloudflare Pages** | Sin definir | **Bloquea el rollback**, que es la contención principal de casi todos los runbooks |
| Guardia / on-call | Sin definir | No hay respuesta P1 garantizada |

La tercera fila es la más crítica en operación: los trece runbooks apuntan al rollback como mitigación, y **no consta quién puede ejecutarlo**.

Registrado como `OPS-05`, severidad **HIGH**.

## 4. Propuesta de `CODEOWNERS`

`INSTRUMENTACIÓN SEGURA` — **no implementada** (requiere nombres reales):

```
# .github/CODEOWNERS
/src/shared/auth/          @responsable-seguridad
/middleware.ts             @responsable-seguridad
/src/shared/api/           @responsable-integraciones
/src/observability/        @responsable-privacidad
/public/_headers           @responsable-seguridad
/.github/workflows/        @responsable-plataforma
/src/config/env.ts         @responsable-plataforma
/docs/                     @responsable-documentacion
```

GitHub exigiría revisión del propietario en cada PR que toque esas rutas. Es el control de menor coste y mayor efecto sobre las brechas de gobierno detectadas.

## 5. Responsabilidad compartida con el backend

Conviene dejarlo explícito porque condiciona todo el modelo de seguridad:

| Responsabilidad | Frontend | Backend |
|---|:--:|:--:|
| Validar el JWT | ❌ | ✅ |
| Autorizar por rol | ❌ (solo interfaz) | ✅ |
| Proteger datos | ❌ **Imposible** | ✅ |
| Emitir e invalidar sesiones | ❌ | ✅ |
| Firmar subidas a Cloudinary | ❌ | ✅ |
| Auditoría de acciones | ❌ | ✅ |
| Experiencia y accesibilidad | ✅ | ❌ |
| Rendimiento del cliente | ✅ | ❌ |
| Redacción de telemetría | ✅ | ✅ |

**El frontend no puede proteger ningún dato.** Si un endpoint no valida el rol, ninguna medida de la interfaz lo compensa. Ver [../security/threat-model.md](../security/threat-model.md), amenaza E2.

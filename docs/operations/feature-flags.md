# Feature flags

- **Fecha de evidencia:** 2026-08-03

## 1. Estado

**No existe plataforma de feature flags.** Hay **una única bandera**, implementada como variable de entorno.

| Bandera | Tipo | Por defecto | Ámbito |
|---|---|---|---|
| `NEXT_PUBLIC_TUTORIALS_REMOTE_PROGRESS` | booleano | `false` | Build completo |

## 2. La bandera, en detalle

El comentario de [config/env.ts](../../src/config/env.ts) es explícito:

> *«Activa la sincronización del progreso de tutoriales con el backend. Se deja en `false` hasta que exista `/api/v1/me/tutorials/progress`; con la bandera apagada el progreso se guarda solo en el navegador.»*

| Estado | Comportamiento |
|---|---|
| `false` (actual) | El progreso vive en `localStorage`. No se llama al backend |
| `true` | Se sincroniza con `/api/v1/me/tutorials/progress` — **endpoint que aún no existe** |

**Es un buen ejemplo de deriva contractual gestionada.** El contrato está declarado en `ENDPOINTS.tutorials`, marcado como `PENDIENTE_CM` en la documentación, y protegido tras una bandera apagada. El código está preparado, el comportamiento degradado es correcto, y activar la funcionalidad será un cambio de una variable cuando el backend esté listo.

## 3. Limitaciones del mecanismo

Al ser una variable `NEXT_PUBLIC_*`:

| Limitación | Consecuencia |
|---|---|
| Se incrusta en build | Cambiarla exige **reconstruir y desplegar** |
| Es global | No se puede activar por usuario, rol ni porcentaje |
| No hay despliegue progresivo | Es todo o nada |
| No hay desactivación de emergencia | Apagar una funcionalidad requiere un build o un rollback |
| Es pública | Cualquiera puede leer su valor en el bundle |

La cuarta es la más relevante en operación: **no se puede apagar una funcionalidad problemática en caliente**. La única contención inmediata es el rollback.

## 4. Cuándo bastaría y cuándo no

Este mecanismo es adecuado para lo que hoy se usa: activar una integración cuando el backend esté listo, sin urgencia y sin segmentación.

Sería insuficiente para: pruebas A/B, despliegue progresivo por porcentaje, activación por rol o cliente, o interruptor de emergencia.

Incorporar una plataforma de flags sería `CAMBIO DE PRODUCTO` y **no está justificado hoy**: una sola bandera no lo amortiza. Se documenta el límite para que la decisión se tome con criterio si el número crece.

## 5. Reglas

1. Toda bandera nueva se declara en `envSchema` con `booleanFlag`, en `.env.example` y en esta tabla.
2. Documentar siempre **qué ocurre con la bandera apagada** — ese es el comportamiento real en producción.
3. Una bandera es temporal: al activarse de forma definitiva, retirar el código muerto de la otra rama.
4. Ninguna bandera debe ocultar un control de seguridad.

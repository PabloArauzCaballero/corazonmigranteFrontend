# ADR-0008: El lint bloquea el build

## Estado

**Aceptado** — decisión revertida deliberadamente por el equipo, documentada en el propio código.

## Contexto

`next.config.ts` permite `eslint.ignoreDuringBuilds: true` para que el lint no detenga la construcción. Es una salida habitual cuando hay deuda acumulada.

Este proyecto **lo tuvo desactivado y volvió a activarlo**. El comentario del archivo lo explica:

> *«El lint vuelve a bloquear el build: ya no hay deuda pendiente de react-hooks y dejarlo desactivado permitía que llegaran a producción errores reales (renders en cascada, componentes recreados en cada render, enlaces internos con `<a>`).»*

## Decisión

```ts
eslint: { ignoreDuringBuilds: false }
```

Con `eslint-plugin-react-hooks@7.1.1` y `eslint-config-next@15.4.7`. El script de lint es `eslint . --max-warnings=0`: **ni una sola advertencia**.

## Fuerzas

Los tres problemas que el comentario enumera no son cuestiones de estilo:

| Problema detectado | Consecuencia real |
|---|---|
| Renders en cascada | Peticiones duplicadas y parpadeos |
| Componentes recreados en cada render | Pérdida de estado y trabajo innecesario |
| Enlaces internos con `<a>` | Recarga completa de la página en vez de navegación cliente |

**En este proyecto, el lint es una herramienta de rendimiento y corrección, no de formato.**

## Consecuencias positivas

- Imposible desplegar con un error de lint.
- `--max-warnings=0` impide que las advertencias se acumulen hasta volverse ruido ignorado.
- `react-hooks` detecta dependencias incorrectas en `useEffect`, la causa más común de renders en cascada.
- Contribuye a evitar errores de hidratación.

## Consecuencias negativas

- El build tarda más: incluye la pasada de lint.
- Un fallo de lint bloquea un despliegue urgente. **No hay vía de escape documentada** para una corrección de emergencia.
- Requiere disciplina: la tentación de volver a desactivarlo reaparece con cada bloqueo.

Sobre la segunda: en un incidente P1 que exija desplegar una corrección de inmediato, un error de lint no relacionado detendría el despliegue. La vía correcta en ese caso es el **rollback**, no desactivar el lint — y conviene tenerlo claro antes de que ocurra.

## Excepciones legítimas

Existe al menos un `eslint-disable` justificado con comentario:

```ts
// eslint-disable-next-line react-hooks/set-state-in-effect
setSessionState(readClientSession());
```

en `SessionProvider`, con explicación de por qué la lectura de `localStorage` **debe** ocurrir en un efecto para no romper la hidratación.

**Regla: todo `eslint-disable` debe llevar comentario explicando por qué la regla no aplica.** Un `disable` sin justificación es deuda encubierta.

## Riesgos

| Riesgo | Severidad |
|---|---|
| Se vuelve a desactivar bajo presión de entrega | MEDIUM |
| `eslint-disable` sin justificar proliferan | LOW — detectable en revisión |
| Una actualización de `eslint-config-next` introduce reglas nuevas que rompen el build | LOW |

## Evidencia

- [next.config.ts](../../next.config.ts) — la opción y su comentario
- [package.json](../../package.json) — `"lint": "eslint . --max-warnings=0"`
- Línea base 2026-08-03: `yarn lint` exit 0, cero advertencias
- [use-session.tsx](../../src/shared/auth/use-session.tsx) — `eslint-disable` justificado

## Plan de revisión

Revisar solo si el coste de tiempo de build se vuelve problemático. Desactivarlo por deuda acumulada sería revertir una decisión tomada precisamente para evitar esa deuda.

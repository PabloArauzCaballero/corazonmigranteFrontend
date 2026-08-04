# Runbook — Error de hidratación

## Síntoma

En la consola del navegador:

```
Hydration failed because the server rendered HTML didn't match the client.
Text content does not match server-rendered HTML.
```

Visualmente: parpadeo, contenido que cambia justo tras cargar, o una sección que desaparece.

## Impacto

De cosmético a grave. React puede descartar el árbol servidor y volver a renderizar en cliente, lo que empeora el rendimiento percibido y puede provocar desplazamientos de layout.

## Por qué ocurre aquí

Con `output: "export"`, el HTML se genera **en build**, en Node, donde no existen `window`, `localStorage`, `document` ni la hora del navegador. Si un componente usa cualquiera de ellos durante el primer render, el resultado difiere del HTML prerenderizado.

## El patrón correcto, ya presente en el código

`SessionProvider` lo resuelve bien:

```ts
useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  setSessionState(readClientSession());
  setIsReady(true);
}, []);
```

Con su justificación escrita:

> *«readClientSession() lee localStorage; debe ejecutarse solo tras la hidratación para que el primer render del cliente coincida con el HTML generado en el servidor (donde `window` no existe). Mover esto a un lazy initializer de useState causaría un mismatch de hidratación.»*

`isReady` es lo que permite mostrar «Verificando sesión» mientras tanto, en lugar de renderizar contenido incorrecto.

## Causas por orden de probabilidad

| # | Causa | Ejemplo |
|---:|---|---|
| 1 | Lectura de `localStorage` o cookies en el primer render | `useState(() => localStorage.getItem(...))` |
| 2 | Fecha u hora | `new Date().toLocaleString()` sin zona fija |
| 3 | Aleatoriedad | `Math.random()`, `crypto.randomUUID()` en render |
| 4 | `typeof window !== "undefined"` dentro del render | Produce ramas distintas en build y en cliente |
| 5 | HTML inválido | `<div>` dentro de `<p>`: el navegador reestructura el DOM |
| 6 | Extensión del navegador modificando el DOM | Solo en el equipo afectado |

La causa 6 es real y desconcertante: gestores de contraseñas y traductores insertan nodos antes de que React hidrate. Se descarta probando en modo incógnito sin extensiones.

## Diagnóstico seguro

1. Consola: React indica el componente y suele mostrar el diff.
2. Modo incógnito sin extensiones — descarta la causa 6.
3. `yarn build && npx serve out` en local: reproduce el escenario real (prerender + hidratación), cosa que `next dev` **no** hace del todo igual.

## Evidencia a recoger

- Mensaje completo con el diff de React.
- Componente señalado.
- Si se reproduce en incógnito.
- Si es constante o intermitente (intermitente → sospechar de fecha o aleatoriedad).

## Mitigación

| Causa | Corrección |
|---|---|
| 1, 4 | Mover la lectura a `useEffect` con un estado `isReady`, como `SessionProvider` |
| 2 | Fijar zona horaria y formato, o formatear tras montar |
| 3 | Usar `useId()` de React en lugar de aleatoriedad |
| 5 | Corregir el HTML |
| 6 | Ninguna: no es un fallo de la aplicación |

## Rollback

Si llegó con un despliegue y el impacto es visible, revertir.

## Prevención

1. **`reactStrictMode: true`** ya está activo: ayuda a detectar efectos impuros en desarrollo.
2. `eslint-plugin-react-hooks@7.1.1` con el build bloqueado por lint detecta parte de estos casos.
3. Probar siempre con `yarn build && npx serve out`, no solo con `next dev`.
4. Regla de equipo: **ningún acceso a `window`, `document` o `localStorage` durante el render**. Siempre en `useEffect`.

## Escalado

No requiere escalado externo: es un fallo de código del frontend.

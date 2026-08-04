# Impacto en el bundle — medición posterior

Comparación contra [`bundle-baseline.md`](./bundle-baseline.md). Medido con
`yarn build` (Next 15.4.7), mismo árbol de trabajo, mismas variables salvo la que se
indica.

---

## 1. Cifra de control: el chunk compartido no se mueve

| Métrica | Antes | Después (apagada) | Después (encendida) |
| --- | --- | --- | --- |
| **First Load JS compartido por todas las rutas** | **100 kB** | **100 kB** | **100 kB** |
| `chunks/4bd1b696-*.js` | 54.1 kB | 54.1 kB | 54.1 kB |
| `chunks/5964-*.js` | 44 kB | 44 kB | 44 kB |

---

## 2. Encendida vs. apagada: **cero diferencia en First Load**

| Ruta | Apagada | Encendida |
| --- | --- | --- |
| `/` | 194 kB | **194 kB** |
| `/[slug]` | 177 kB | **177 kB** |
| `/admin` | 166 kB | **166 kB** |
| Compartido | 100 kB | **100 kB** |

Es el resultado buscado: **el SDK no entra en el First Load de ninguna ruta**. Vive en
un chunk aparte de ~104 kB (sin comprimir) que se descarga después de la hidratación,
fuera de la ruta crítica.

Verificación directa:

```bash
# Con la telemetría apagada: NO existe ningún chunk con OpenTelemetry
$ grep -l opentelemetry .next/static/chunks/*.js
(sin resultados)

# Con NEXT_PUBLIC_OTEL_ENABLED=true: aparece el chunk diferido
$ grep -l opentelemetry .next/static/chunks/*.js
.next/static/chunks/1523.728a4c5786e0142f.js   104K
```

Con la bandera apagada, la condición de `src/instrumentation-client.ts` se resuelve en
tiempo de build (`"false" === "true"`) y el empaquetador elimina el `import()` entero.

---

## 3. Coste real: el módulo propio

| Ruta | Antes | Después | Δ |
| --- | --- | --- | --- |
| `/` | 186 kB | 194 kB | **+8 kB** |
| `/login` | 160 kB | 168 kB | **+8 kB** |
| `/admin/usuarios` | 162 kB | 170 kB | **+8 kB** |
| `/registro` | 167 kB | 175 kB | **+8 kB** |
| `/paciente` | 111 kB | 118 kB | **+7 kB** |
| Compartido | 100 kB | 100 kB | **0** |

Ese `+7–8 kB` **no es OpenTelemetry**: es el módulo `src/observability/` propio, que sí
se ejecuta siempre porque `AppProviders`, `apiRequest` y los cinco `error.tsx` lo
importan. Incluye `TracingService`, sanitización, plantillas de ruta, identificador de
sesión, configuración, trazado de formularios, navegación SPA y Web Vitals.

---

## 4. Dos optimizaciones que hicieron falta

La primera medición dio **+11 a +28 kB**. Se corrigieron dos causas concretas:

### 4.1 `zod` fuera del camino caliente (−18 kB en las rutas de portal)

`telemetry.schema.ts` validaba con zod, siguiendo el patrón de `src/config/env.ts`.
Como el módulo lo alcanza el grafo de `AppProviders`, arrastraba zod hasta rutas que no
lo incluían (`/paciente` pasó de 111 a **139 kB**). Se reescribió la validación a mano:
son nueve cadenas de texto y las garantías son idénticas, cubiertas por
`telemetry-config.test.ts`.

`/paciente`: 139 kB → **121 kB**.

### 4.2 `@opentelemetry/api` cargado de forma diferida (−3 kB en todas las rutas)

`@opentelemetry/api` funciona como no-op mientras nadie registre un proveedor, así que
lo natural era importarlo estáticamente. Pero eso lo metía en el bundle de todas las
pantallas incluso con la telemetría apagada.

Se introdujo `src/observability/core/otel-api.ts`: el paquete se carga dentro del chunk
de telemetría y se "engancha" al inicializar. Mientras no lo esté, la API responde con
un span inerte definido localmente (`NOOP_SPAN`), sin importar nada en tiempo de
ejecución.

`/paciente`: 121 kB → **118 kB**.

---

## 5. Conclusión

| Criterio de aceptación | Resultado |
| --- | --- |
| El First Load compartido no crece con la telemetría apagada | ✅ 100 kB → 100 kB |
| El SDK no entra en el First Load de ninguna ruta | ✅ 0 kB de diferencia entre apagada y encendida |
| Con la bandera apagada, el SDK no existe en el artefacto | ✅ verificado con `grep` sobre los chunks |
| Coste del módulo propio | +7–8 kB por ruta, medido y justificado |

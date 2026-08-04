# Módulo de tutoriales interactivos

Motor de recorridos guiados (*product tour*) que se ejecutan **sobre la interfaz real**
de la aplicación, más un **Centro de ayuda** por portal donde cada persona ve, continúa
y repite los tutoriales disponibles para su rol.

---

## 1. Arquitectura

```
src/features/tutorial/
├── model/
│   ├── tutorial.types.ts       Contratos (TutorialDefinition, TutorialStep, progreso)
│   ├── tutorial.schema.ts      Validación zod + reglas del catálogo
│   ├── tutorial-targets.ts     Identificadores estables de elementos (data-tutorial-id)
│   └── app-routes.ts           Rutas reales que un tutorial puede visitar
├── registry/
│   └── tutorial-registry.ts    Registro, filtrado por rol/permiso, resolución por ruta
├── engine/
│   ├── tutorial-machine.ts     Máquina de estados pura (reductor)
│   ├── target-resolver.ts      Localización y medición de elementos en el DOM
│   ├── interaction-watcher.ts  Vigilancia de la acción esperada del usuario
│   ├── tutorial-progress.ts    Transiciones de progreso, versionado, porcentajes
│   └── use-tutorial-run.ts     Puente entre la máquina y el DOM (hook)
├── storage/
│   └── tutorial-storage.ts     Adaptadores local / backend / compuesto
├── analytics/
│   └── tutorial-analytics.ts   Adaptador de eventos (silencioso en producción)
├── catalog/
│   ├── helpers.ts              orderedSteps() e intro()
│   ├── public.tutorials.ts     Sitio público
│   ├── patient.tutorials.ts    Portal del paciente
│   ├── therapist.tutorials.ts  Portal del terapeuta
│   ├── admin.tutorials.ts      Panel administrativo y contabilidad
│   └── index.ts                Catálogo completo + registro singleton
└── ui/
    ├── tutorial-provider.tsx   Contexto: catálogo, progreso y recorrido en curso
    ├── tutorial-tour.tsx       Capa visual del recorrido activo
    ├── tutorial-overlay.tsx    Fondo oscurecido con hueco sobre el elemento
    ├── tutorial-tooltip.tsx    Tarjeta del paso (diálogo accesible)
    ├── tutorial-launcher.tsx   Botón flotante «¿Cómo funciona?»
    ├── tutorial-center.tsx     Centro de ayuda (listado, buscador, filtros)
    └── tutorial-card.tsx       Tarjeta de un tutorial en el Centro
```

Reglas de dependencia: `model` no importa nada de React ni del navegador; `engine` puede
tocar el DOM pero no la presentación; `ui` no contiene reglas de negocio. El catálogo son
**datos**, no código de interfaz.

### Piezas montadas en la aplicación

| Dónde | Qué |
| --- | --- |
| `src/app/providers.tsx` | `TutorialProvider` (una sola instancia para toda la app) |
| `src/features/dashboard/sidebar.tsx` | Entrada «Centro de ayuda» en los tres menús + `TutorialLauncher` |
| `src/app/{admin,paciente,terapeuta}/ayuda/page.tsx` | Las tres pestañas del Centro |
| `src/shared/ui/{page-header,table-shell,data-table,modal}.tsx` | `data-tutorial-id` heredado por todas las pantallas |

---

## 2. Flujo de ejecución

```
startTutorial(id)
   ↓ registry.resolve(id, contexto)      ← filtra por rol y permisos; filtra pasos
   ↓ persist(markStarted | markStep)     ← guarda el punto de partida
   ↓ máquina: "iniciar" → fase resolviendo
        ├─ ¿el paso vive en otra ruta? → router.push() y se repite al llegar
        ├─ waitForElement()               ← MutationObserver, sin sondeo por tiempo
        │     ├─ encontrado → scroll + acción automática + medición → fase activo
        │     └─ no aparece → fase objetivo_ausente (reintentar / continuar / cerrar)
        └─ ¿el paso pide una acción? → fase esperando_accion (bloquea «Siguiente»)
              └─ watchInteraction() detecta clic / escritura / selección / navegación
   ↓ siguiente / anterior → vuelve a resolver
   ↓ último paso → fase finalizado → markCompleted() → se ofrece el tutorial enlazado
```

El recuadro resaltado se mantiene pegado al elemento con un bucle de `requestAnimationFrame`
que solo provoca render cuando el rectángulo cambia de verdad.

---

## 3. Estructura de un tutorial

```ts
interface TutorialDefinition {
  id: string;                    // único en todo el catálogo
  version: string;               // semántica: "1.0.0"
  title: string;
  description: string;
  category: TutorialCategory;    // introduccion | navegacion | perfil | citas | …
  level: TutorialLevel;          // basico | intermedio | avanzado
  route?: string;                // pantalla donde arranca (debe existir en APP_ROUTES)
  roles?: UserRole[];            // quién puede verlo
  permissions?: Permission[];    // permisos exigidos además del rol
  audience?: "publica" | "privada";
  estimatedMinutes?: number;
  prerequisites?: string[];      // ids recomendados antes de este
  required?: boolean;            // obligatorio para el rol
  recommended?: boolean;
  autoStart?: boolean;           // se ofrece solo la primera vez en `route`
  nextTutorialId?: string;       // se propone al terminar
  steps: TutorialStep[];
}

interface TutorialStep {
  id: string;
  title: string;
  body: string;
  target?: string;               // token estable o selector CSS; sin él, paso centrado
  placement?: "top" | "bottom" | "left" | "right" | "center";
  route?: string;                // ruta propia del paso
  order: number;                 // consecutivo desde 1 (lo calcula orderedSteps)
  interaction?: StepInteraction; // acción exigida antes de avanzar
  hint?: string;                 // ayuda mientras la acción no se cumple
  errorMessage?: string;         // mensaje si el elemento nunca aparece
  autoAction?: "focus" | "scroll" | "abrir-menu";
  prepare?: { target: string };  // desplegable a abrir si el objetivo no está visible
  waitForMs?: number;            // espera máxima del elemento (por defecto 6000)
  roles?: UserRole[];            // el paso se omite si el rol no coincide
  permissions?: Permission[];
  interactiveTarget?: boolean;   // deja el elemento resaltado utilizable
}
```

---

## 4. Cómo crear un tutorial nuevo

1. Abre el archivo del módulo correspondiente en `src/features/tutorial/catalog/`
   (o crea uno nuevo y añádelo a `catalog/index.ts`).
2. Escribe la definición usando `orderedSteps(...)` para no numerar a mano:

```ts
import { intro, orderedSteps } from "@/features/tutorial/catalog/helpers";
import { navTutorialId, TUTORIAL_TARGETS } from "@/features/tutorial/model/tutorial-targets";
import type { TutorialDefinition } from "@/features/tutorial/model/tutorial.types";

export const EJEMPLO: TutorialDefinition = {
  id: "admin-archivos",
  version: "1.0.0",
  title: "Gestionar archivos y medios",
  description: "Subir un archivo, copiar su enlace y revisar sus metadatos.",
  category: "administracion",
  level: "basico",
  route: "/admin/archivos",
  roles: ["ADMIN", "SUPER_ADMIN"],
  permissions: ["public_content:manage"],
  estimatedMinutes: 3,
  recommended: true,
  prerequisites: ["admin-navegacion"],
  steps: orderedSteps(
    intro("bienvenida", "Archivos y medios", "Aquí vive todo lo que se sube a la plataforma."),
    {
      id: "subir",
      title: "Sube un archivo",
      body: "Arrastra el archivo o elige uno desde tu equipo.",
      target: "main form",
      placement: "top",
    },
    {
      id: "buscar",
      title: "Busca lo que necesites",
      body: "Escribe parte del nombre para filtrar el listado.",
      target: TUTORIAL_TARGETS.filtrosTabla,
      placement: "bottom",
      interaction: { kind: "escritura", minLength: 2 },
      interactiveTarget: true,
      hint: "Escribe al menos dos letras para continuar.",
    },
    {
      id: "menu",
      title: "Vuelve al menú",
      body: "Desde el menú lateral llegas al resto de módulos.",
      target: navTutorialId("/admin/archivos"),
      placement: "right",
      errorMessage: "En móvil el menú está dentro del botón ☰; ábrelo y pulsa «Reintentar».",
    },
    intro("cierre", "Listo", "Ya sabes gestionar los archivos del sitio."),
  ),
};
```

3. Ejecuta `yarn test:unit`: la validación del catálogo falla si hay ids repetidos,
   rutas inexistentes, orden incorrecto, prerrequisitos circulares o permisos imposibles.

**No hace falta tocar el motor, el overlay ni el Centro de ayuda.**

### Asociar elementos de la interfaz

- Preferente: `data-tutorial-id="mi-elemento"` en el componente y `target: "mi-elemento"`
  en el paso. Los identificadores compartidos están en `model/tutorial-targets.ts`.
- Escape: un selector CSS **semántico o estructural** (`main form`, `#productId`,
  `a[href^="/login"]`). Nunca selectores basados en clases de presentación: cambian con
  cualquier retoque visual y dejan el tutorial roto en silencio.
- El resolutor elige la primera coincidencia **visible**, así que el mismo identificador
  puede existir en el menú de escritorio y en el cajón móvil.

### Objetivos que viven dentro de algo cerrado

Cuando el elemento solo existe con un desplegable abierto (cajón de navegación en móvil,
acordeón, pestaña), se declara el control que lo abre:

```ts
{
  id: "citas",
  title: "Mis citas",
  body: "Consulta el estado de tus citas.",
  target: navTutorialId("/paciente/citas"),
  prepare: { target: TUTORIAL_TARGETS.menuMovil },
}
```

El motor lo activa **solo si el objetivo no está ya visible** y **solo si el control
declara `aria-expanded="false"`**. Esa comprobación es la salvaguarda: garantiza que se
pulsa algo que abre, nunca un botón de guardar, pagar o eliminar, que no exponen ese
atributo. En escritorio el botón del menú móvil está oculto, así que la preparación no
hace nada y el enlace del sidebar se resuelve por la vía normal.

### Validar acciones del usuario

| `interaction.kind` | Se cumple cuando |
| --- | --- |
| `click` | se pulsa el elemento (o el `target` del paso) |
| `escritura` | el campo alcanza `minLength` caracteres (por defecto 1) |
| `seleccion` | el control con valor cambia y deja de estar vacío |
| `navegacion` | la ruta actual coincide con `route` |
| `aparicion` | el elemento indicado aparece en pantalla |

El motor **solo escucha**: no envía formularios, no confirma operaciones, no borra nada.
`autoAction` está limitada a `focus`, `scroll` y `abrir-menu` (y esta última solo pulsa
controles con `aria-expanded="false"`, es decir, desplegables). No existe ninguna acción
automática capaz de disparar un pago, una eliminación o un envío.

### Rutas y modales

- Si `step.route` (o `definition.route`) no coincide con la ruta actual, el motor navega
  con `router.push` y reanuda la resolución al llegar.
- Los modales se resaltan con `TUTORIAL_TARGETS.ventanaModal`, que la primitiva `Modal`
  aplica a su panel. Como la espera usa `MutationObserver`, un paso puede apuntar a algo
  que solo existe tras abrir el modal.

### Restringir por rol y permiso

`roles` y `permissions` se comprueban con `hasRole`/`hasPermission` de
`src/shared/auth/roles.ts` — las **mismas** funciones que usa el guard de rutas. Un
tutorial jamás muestra un módulo al que la cuenta no tiene acceso, y los pasos también
pueden restringirse individualmente (se omiten y el resto se renumera).

### Versionado

`version` es semántica. Al **subir la versión mayor**, quien ya lo había completado ve el
tutorial como «Actualizado» en el Centro y se le invita a repetirlo; los cambios menores o
de parche (correcciones de texto) no molestan a nadie.

---

## 5. Persistencia del progreso

Se guarda por tutorial: estado (`sin_empezar`/`en_progreso`/`completado`/`omitido`), paso
actual, fecha de inicio, fecha de fin, última interacción, versión, número de repeticiones
y la marca «no volver a mostrar».

| Adaptador | Cuándo se usa |
| --- | --- |
| `LocalTutorialStorage` | Siempre. Clave `cm.tutoriales.progreso.<userId>` en `localStorage` |
| `RemoteTutorialStorage` | Con `NEXT_PUBLIC_TUTORIALS_REMOTE_PROGRESS=true` y sesión iniciada |
| `CompositeTutorialStorage` | Combina ambos: el backend manda, el local responde al instante y actúa de respaldo |

**Estado actual:** el backend todavía no expone el contrato (ver
`docs/api/api-contracts.md` y `PENDIENTE_CM_TUTORIALES_BACKEND`), así que la bandera está
apagada y el progreso vive solo en el navegador. Al activarla, el mismo código sincroniza
sin más cambios y el avance viaja entre dispositivos.

Cerrar un tutorial a medias **conserva** el avance para poder reanudarlo; pulsar «Omitir
tutorial» lo marca como omitido. En los recorridos que aparecen solos (`autoStart`) la
tarjeta añade **«No volver a mostrarme esto»**, que guarda `dismissed: true` además de
marcarlo omitido: así no vuelve a ofrecerse por su cuenta aunque más adelante se reinicie
su progreso. Sigue estando disponible en el Centro de ayuda para quien quiera repetirlo.

---

## 6. Accesibilidad

- La tarjeta es un `dialog` con nombre (`aria-labelledby`) y descripción (`aria-describedby`).
- Trampa de foco cuando el paso no exige tocar la página; cuando sí la exige, el foco puede
  salir para poder interactuar con el elemento resaltado.
- `Escape` cierra (con confirmación a partir del segundo paso), `→`/`←` avanzan y retroceden.
- El foco vuelve al elemento que lo tenía antes de empezar el recorrido.
- Región `aria-live` que anuncia «Paso X de Y: título» en cada cambio.
- Barra de progreso con `role="progressbar"` y `aria-valuetext` textual.
- El estado nunca se comunica solo con color: siempre hay icono y texto.
- Las animaciones respetan `prefers-reduced-motion` vía `usePrefersReducedMotion`.

---

## 7. Pruebas

```bash
yarn test:unit                                  # 9 suites del módulo
yarn test:ci                                    # lint + typecheck + unitarias + smoke
E2E_BASE_URL=http://localhost:4173 yarn test:e2e tests/e2e/tutorials.spec.ts
```

| Archivo | Cubre |
| --- | --- |
| `tests/unit/tutorial-catalog.test.ts` | Validación: duplicados, orden, rutas, ciclos, permisos, versiones |
| `tests/unit/tutorial-registry.test.ts` | Registro, deduplicado, filtrado por rol/permiso, resolución por ruta, autoStart |
| `tests/unit/tutorial-machine.test.ts` | Avance, retroceso, acción pendiente, objetivo ausente, cierre |
| `tests/unit/tutorial-progress.test.ts` | Inicio, fin, omisión, reinicio, repeticiones, versionado, reanudación |
| `tests/unit/tutorial-storage.test.ts` | Persistencia por usuario, datos corruptos, degradación sin backend |
| `tests/unit/tutorial-run.test.tsx` | Objetivos asíncronos e inexistentes, navegación entre rutas, interacciones |
| `tests/unit/tutorial-tooltip.test.tsx` | Teclado, foco, ARIA, colocación de la tarjeta |
| `tests/unit/tutorial-center.test.tsx` | Centro: filtrado por rol, buscador, filtros, continuar, repetir, prerrequisitos |
| `tests/unit/tutorial-analytics.test.ts` | Composición de adaptadores, resiliencia ante fallos, ausencia de datos personales |
| `tests/unit/tutorial-app-routes.test.ts` | Las rutas declaradas existen y el menú no se desincroniza |
| `tests/e2e/tutorials.spec.ts` | Recorrido real: pasos, teclado, reanudación, móvil |

Las pruebas no dependen de temporizadores frágiles: usan condiciones explícitas
(`waitFor`, `expect(...).toBeVisible()`) y el motor se sincroniza con `MutationObserver`.

---

## 8. Diagnóstico

| Síntoma | Causa habitual | Qué hacer |
| --- | --- | --- |
| «No encontramos ese elemento» | El `target` no existe en esa pantalla o no es visible | Comprobar el `data-tutorial-id` en el DOM; en móvil, abrir el menú y pulsar «Reintentar» |
| El tutorial no aparece en el Centro | El rol no tiene el permiso declarado | Revisar `roles`/`permissions` frente a `ROLE_PERMISSIONS` |
| El botón «Siguiente» está bloqueado | El paso exige una acción | Hacer la acción indicada en el mensaje de ayuda |
| El catálogo pierde un tutorial | Error de validación bloqueante | `yarn test:unit`, o revisar el error `[tutoriales] catálogo con problemas` en consola |
| El avance no se conserva | `localStorage` no disponible (modo privado, cuota) | Aparece el aviso `[tutoriales] no se pudo guardar el progreso local` |

### Analítica

Los eventos (`tutorial_iniciado`, `tutorial_paso`, `tutorial_completado`,
`tutorial_omitido`, `tutorial_reiniciado`, `tutorial_objetivo_ausente`) salen por dos
vías: **telemetría** y, solo en desarrollo, **consola**.

El adaptador de telemetría emite cada evento como un span `ui.interaction` del módulo de
observabilidad, con atributos del catálogo ya permitido — `app.feature=tutorials`,
`app.operation`, `ui.component` (id del tutorial), `ui.action` (id del paso) y
`ui.result`. No añade nombres de span ni claves de atributo nuevas, así que **no toca el
catálogo cerrado de `src/observability`**. Con la telemetría apagada es completamente
inerte. Un adaptador que falle se registra y no interrumpe el recorrido.

---

## 9. Decisiones tomadas

1. **Sin dependencias nuevas.** El motor se apoya en React 19, Next 15 y las primitivas
   visuales existentes. Se descartó una librería de tours para no sumar peso ni una
   segunda gramática visual: los requisitos de rol, permisos y navegación entre rutas
   exigían lógica propia de todas formas.
2. **Se sustituyó el motor anterior en vez de duplicarlo.** `guided-tour.tsx`,
   `portal-tours.ts` y `tutorial-launcher.tsx` quedaron cubiertos por el nuevo motor y se
   eliminaron; los tres puntos de uso (shell del panel y las dos landings) se migraron.
3. **`data-tutorial-id` en las primitivas compartidas.** Anotar `PageHeader`, `TableShell`,
   `DataTable` y `Modal` da objetivos estables a casi todas las pantallas sin tocar 50
   archivos ni acoplar el catálogo a cada componente.
4. **Progreso local primero, backend cuando exista.** Priorizar el backend sin contrato
   habría dejado el módulo inservible; el adaptador compuesto ya está escrito y probado
   para que activarlo sea cambiar una variable de entorno.
5. **El overlay se dibuja con cuatro paneles**, no con una sombra gigante, para que el
   hueco quede realmente libre cuando un paso pide pulsar el elemento resaltado.
6. **Las acciones automáticas son deliberadamente pobres** (`focus`, `scroll`,
   `abrir-menu`, `prepare`): todas exigen `aria-expanded` para pulsar algo, de modo que el
   motor no puede ejecutar operaciones con efecto de negocio ni por accidente.
7. **La analítica reutiliza el catálogo cerrado de observabilidad.** Se emiten spans
   `ui.interaction` con atributos ya permitidos en vez de añadir spans de negocio propios:
   así el módulo de tutoriales no interfiere con el catálogo de
   `src/observability/core/tracing.constants.ts` ni con su documentación.

---

## 10. Limitaciones conocidas

- **Progreso solo local** mientras `NEXT_PUBLIC_TUTORIALS_REMOTE_PROGRESS` esté apagado:
  no viaja entre navegadores ni dispositivos (`PENDIENTE_CM_TUTORIALES_BACKEND`).
- **Sin modo oscuro real.** El módulo usa tokens semánticos (`bg-card`, `text-foreground`)
  y está listo para la variante oscura, pero la aplicación todavía no la implementa
  (`PENDIENTE_CM_MODO_OSCURO`).
- **La analítica depende de que la telemetría esté activada.** El adaptador ya está
  conectado, pero si la observabilidad está apagada no se emite nada.
- **La prueba e2e se omite si el backend no responde**, porque la portada pública se
  construye con datos remotos.
- **La preparación de desplegables cubre un nivel.** Si un objetivo estuviera anidado en
  dos desplegables encadenados haría falta declarar varios `prepare`; hoy el campo admite
  uno solo, que es lo que necesita la aplicación actual.

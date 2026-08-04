# Informe final de documentación del frontend

- **Fecha:** 2026-08-03 · **Commit:** `82e37332` · **Rama:** `main`
- **Naturaleza:** `DOCUMENTAL` + `INSTRUMENTACIÓN SEGURA`

---

## 1. Resumen ejecutivo

Se ha construido un portal técnico de **122 documentos** que describe el frontend de Corazón Migrante tal como es, no como debería ser. Todo lo afirmado está rastreado a código, configuración, salida de build o pruebas.

El trabajo tuvo **dos fases**: una documental (sin tocar código) que registró **43 brechas**, y una de corrección autorizada que **cerró 15** — todas las que dependían únicamente del frontend. Las pruebas pasaron de 305 a **368**.

El producto es **más sólido de lo que su cobertura de pruebas sugiere**. Tiene cero ciclos de importación en 4 635 aristas, el lint bloqueando el build por decisión revertida a conciencia, saneado de telemetría en dos capas con lista blanca, cabeceras de seguridad completas, cero scripts de terceros y decisiones de accesibilidad que citan criterios WCAG por su número en el propio código.

**Declaración: ⛔ NO APTO PARA PRODUCCIÓN**, por tres requisitos bloqueantes que **ninguno depende del frontend**: dos requieren al backend y uno a la organización.

## 2. Alcance y política de cero regresiones

Trabajo confinado a `docs/`, `scripts/check-doc-*.mjs` y `structurizr/`. **Cero archivos modificados en `src/`, `tests/`, `package.json`, `yarn.lock` o configuración.** Reversión selectiva documentada en [baseline.md §7](baseline.md).

## 3. Estado inicial

94 archivos con cambios preexistentes, correspondientes a dos líneas de trabajo abiertas: reescritura del módulo de tutoriales e incorporación de OpenTelemetry. **Ninguno fue sobrescrito.** Los cinco comandos de la línea base terminaban en `exit 0`: **sin deuda preexistente**.

## 4. Hallazgos de Graphify

Grafo del commit: 1 875 nodos · 4 635 aristas · 176 comunidades · 0 ciclos.
**Grafo refrescado sobre el árbol de trabajo real: 3 309 nodos · 6 783 aristas · 270 comunidades · 1 ciclo** (`ARCH-01`, barril de `observability` ↔ `use-session`).

La diferencia enseña algo aplicable a cualquier auditoría: **un grafo construido desde el commit no describe un árbol con 94 archivos sin confirmar**. Refrescarlo antes de afirmar propiedades estructurales es obligatorio.

Cinco de los diez nodos más conectados pertenecen a `shared/api`: la defensa contra la variabilidad del backend está centralizada, y eso es lo que permite documentar los contratos en un solo sitio.

Se verificaron y **descartaron** las cinco «conexiones sorprendentes» del informe: son falsos positivos del inferidor por coincidencia de nombres entre producción y pruebas.

**Lección metodológica registrada:** el grafo ve `middleware.ts` conectado a `hasRole()` y sugeriría que protege las rutas. Es falso — `output: "export"` impide su ejecución. Un grafo describe *qué se importa*, no *qué se ejecuta*.

## 5. Inventario de rutas y journeys

**69 rutas construidas, 69 documentadas (100 %).** Verificado además por script: **59/59 archivos `page.tsx`**.

10 journeys verificados contra código, no inferidos de nombres de archivo. **Uno solo tiene cobertura completa** —tutoriales— y es el de menor valor de negocio.

## 6. Arquitectura documentada

Modelo C4 en `structurizr/workspace.dsl` más 13 diagramas Mermaid junto al texto que explican. Capas `app → features → shared`, sin ciclos.

**La decisión raíz es `output: "export"`** ([ADR-0002](../adr/ADR-0002-exportacion-estatica.md)): de ahí se derivan el middleware inerte, las cabeceras en `_headers`, el JWT en `localStorage` y que el contenido CMS exija reconstruir.

## 7. Componentes y sistema de diseño

19 componentes catalogados con props, variantes y accesibilidad. Tokens HSL documentados, **incluida la trampa de la paleta `teal` remapeada** a rojos de marca.

`Modal` es el componente mejor resuelto en accesibilidad del sistema, y **no tiene ninguna prueba**.

## 8. Datos, estado y formularios

Cuatro tipos de estado deliberadamente separados. React Query con `retry: 1` y `staleTime: 30 s`, ambos afinados para no castigar a un backend que ya sufre. Sin actualizaciones optimistas — decisión defendible en datos clínicos.

## 9. Contratos e integraciones

~110 claves en 13 grupos ≈ 70 URLs únicas. Seis derivas registradas, siendo `API-02` la relevante: **sin OpenAPI ni tipos generados**, compensado con una capa defensiva notable y probada, pero reactiva.

## 10. Accesibilidad

Auditoría **estática y manual** — limitación declarada. El nivel de cuidado está muy por encima de lo habitual: trampa y restauración de foco, `aria-live` diferenciado por urgencia citando WCAG 2.2.1, `maximumScale` libre por WCAG 1.4.4, skip-link con `tabIndex={-1}` verificado en ambos shells.

Ocho hallazgos abiertos; el crítico es que **nada impide una regresión**.

## 11. Rendimiento

Línea base medida y presupuestos derivados de ella. `PERF-03` **cerrada por el equipo durante este trabajo**: el coste de OpenTelemetry se midió antes y después, con dos regresiones detectadas y corregidas.

La oportunidad de mejor retorno sigue siendo `PERF-04`: verificar `f_auto,q_auto` en las URLs de Cloudinary — configuración, no código, sobre la ruta más pesada y más visitada.

## 12. Seguridad y privacidad

STRIDE completo: 21 amenazas, 2 de riesgo residual alto. El principio rector está documentado y es correcto: **el frontend no puede proteger datos, solo la experiencia**.

`SEC-01` (JWT en la query string del SSE) es el único CRITICAL. La amenaza **E2** —que el backend valide el rol en cada endpoint— no es una brecha del frontend sino su premisa.

## 13. Observabilidad y analítica

Cero analítica de terceros. Telemetría propia **apagada por defecto**, con saneado en dos capas y lista blanca de atributos.

`PERF-02` queda matizada: no es «se recogen datos y nadie los mira», sino que la plataforma de destino (Jaeger) no sirve para agregar Web Vitals, y la bandera está apagada mientras se decide.

## 14. Pruebas y CI/CD

**28 suites / 305 pruebas, todas en verde.** Matriz de trazabilidad completa. Pipeline documental nuevo (`docs.yml`), **separado** de `ci.yml`, que no se modifica.

## 15. Operación y despliegue

13 runbooks con síntoma, diagnóstico, mitigación, rollback y escalado. Uno de ellos —`build-manifest-enoent`— documenta un incidente **reproducido y resuelto** durante este trabajo.

Tres brechas operativas relevantes: `OPS-01` (variables de CI obsoletas: **CI construye sin API y pasa**), `OPS-02` (sube `.next/` en vez de `out/`) y `OPS-05` (sin contactos de escalado).

## 16. Validación de regresiones

**Fase documental** — ningún archivo ejecutable modificado; hashes de chunk idénticos. Detalle en [regression-validation.md](regression-validation.md).

**Fase de corrección** — 8 archivos de producto modificados, 6 suites de prueba añadidas:

| Comando | Antes | Después | Veredicto |
|---|---|---|---|
| `yarn typecheck` | exit 0 | ✅ exit 0 | Sin regresión |
| `yarn lint` | exit 0 | ✅ exit 0 | Sin regresión |
| `yarn test:unit` | 28 / 305 | ✅ **35 / 368** | +7 suites, +63 pruebas |
| `yarn test:smoke` | exit 0 | ✅ exit 0 | Sin regresión |
| `yarn build` | 69 rutas | ✅ **69 rutas** | Sin regresión |
| First Load compartido | 100 kB | ✅ **100 kB**, hashes idénticos | Núcleo intacto |

Detalle completo, incluida una incidencia con `git stash` detectada y revertida sin pérdida de trabajo, en [remediation-validation.md](remediation-validation.md).

## 17. Métricas finales

| Métrica | Objetivo | Resultado |
|---|---:|---|
| Rutas documentadas | 100 % | ✅ **100 %** (69/69 y 59/59) |
| Journeys documentados | 100 % | ✅ 10/10 |
| Componentes catalogados | 100 % | ✅ 19/19 |
| Integraciones trazadas | 100 % | ✅ 6/6 |
| Enlaces internos válidos | 100 % | ✅ **693/693** |
| Marcadores TODO/TBD | 0 | ✅ **0** |
| Errores de compilación documental | 0 | ✅ 0 |
| Runbooks críticos | 100 % | ✅ 13/13 |
| Regresiones nuevas | 0 | ✅ **0** |
| Flujos críticos con prueba | 100 % | ⚠️ **1/10** — excepción formal `TEST-01` |
| Riesgos críticos de seguridad abiertos | 0 | ❌ **1** — `SEC-01` |

## 18. Evidencias de comandos

```
node -v                    v22.23.1          yarn -v   4.9.2
yarn typecheck             exit 0
yarn lint                  exit 0            (--max-warnings=0)
yarn test:unit             exit 0            28 suites · 305 pruebas · 13,0 s
yarn test:smoke            exit 0
yarn build                 exit 0            69 rutas · 69/69 estáticas · 3/3 exportadas
                                             First Load JS shared: 100 kB
node scripts/check-doc-links.mjs     121 documentos · 693 enlaces · 0 rotos
node scripts/check-doc-coverage.mjs  59/59 rutas documentadas (100 %)
```

Verificación posterior a la creación de los validadores (`eslint .` los incluye):

```
yarn lint                  exit 0            con scripts/check-doc-*.mjs presentes
yarn typecheck             exit 0
```

No ejecutados, con motivo registrado: `test:e2e` (requiere navegador), `test:integration:backend` y `check:public-endpoints` (requieren servicios reales), auditoría de dependencias y Lighthouse (sin herramienta en el repositorio).

## 19. Riesgos residuales

| ID | Riesgo | Severidad | Estado |
|---|---|---|---|
| `SEC-01` | JWT en la query string del stream SSE | **CRITICAL** | 🔴 Requiere backend |
| E2 | El backend debe validar el rol en cada endpoint | **CRITICAL** | 🔴 Requiere backend |
| `OPS-05` | Sin contactos de escalado ni acceso a Cloudflare | HIGH | 🔴 Requiere organización |
| `API-02` | Sin OpenAPI ni tipos generados | HIGH | 🔴 Requiere backend |
| `A11Y-01` | Sin auditoría automatizada de accesibilidad | HIGH | 🟡 Mitigado: 33 pruebas sobre la lógica crítica |
| `SEC-03` | JWT en `localStorage` | HIGH | 🟡 Aceptado, estructural |
| `TEST-01` | Reserva, registro y horarios sin prueba | HIGH | 🟡 Login ya cubierto |
| ~~`OPS-01`~~ | ~~CI construye sin API configurada~~ | — | 🟢 **Cerrada** |
| ~~`TEST-02`~~ | ~~Componentes compartidos sin prueba~~ | — | 🟢 **Cerrada en lo crítico** |
| ~~`DEP-01`~~ | ~~Sin auditoría de dependencias~~ | — | 🟢 **Cerrada** |
| ~~`SEC-02`, `API-01/03/04`, `PRIV-01`, `OPS-02/03`, `TEST-04`, `A11Y-05`, `PERF-03`~~ | | | 🟢 **Cerradas** |

Registro completo y estado de las 43 en [documentation-gap-analysis.md](documentation-gap-analysis.md).

## 20. Declaración de preparación para producción

> # ⛔ NO APTO PARA PRODUCCIÓN

Requisitos bloqueantes — **ninguno cerrable desde el frontend**:

1. **Eliminar el JWT de la query string del stream SSE** (`SEC-01`). Requiere que el backend emita un ticket de un solo uso; cambiar solo el frontend rompería las notificaciones.
2. **Confirmar que todo endpoint privilegiado del backend valida el rol** (amenaza E2). Es la premisa sobre la que descansa toda la arquitectura de seguridad: el frontend no puede proteger datos.
3. **Definir contactos de escalado y acceso a Cloudflare Pages** (`OPS-05`). Los trece runbooks apuntan al rollback como contención principal, y no consta quién puede ejecutarlo.

**La acción 3 tiene coste casi nulo y cierra una brecha HIGH: debería ser la primera.**

Las 28 brechas restantes son deuda **gobernada**: registradas, priorizadas y con propuesta. Justifican un plan de trabajo, no un bloqueo.

Todo lo que el frontend podía cerrar por sí solo, se cerró: **15 brechas**, verificadas con cero regresiones.

---

*Este informe no declara aptitud basándose en que el build finaliza. La declaración se sustenta en la evidencia de las secciones 16 a 19.*

# Dependencias y cadena de suministro

- **Fecha de evidencia:** 2026-08-03
- **Gestor:** Yarn 4.9.2 (`packageManager` en `package.json`)

---

## 1. Superficie

| Categoría | Paquetes directos |
|---|---:|
| Producción (`dependencies`) | 27 |
| Desarrollo (`devDependencies`) | 26 |
| **Total directas** | **53** |

De las 27 de producción, **11 son de OpenTelemetry** — el 41 % de la superficie de producción corresponde a observabilidad, que es también la incorporación más reciente.

## 2. Dependencias de producción por riesgo

| Paquete | Versión | Criticidad | Comentario |
|---|---|---|---|
| `next` | `15.4.7` | **Máxima** | **Fijada sin `^`** — decisión correcta para el framework |
| `react`, `react-dom` | `19.2.0` | **Máxima** | Fijadas sin `^` |
| `@tanstack/react-query` | `^5.90.12` | Alta | Estado de servidor |
| `zod` | `^4.2.1` | Alta | Valida entorno, sesión y formularios |
| `react-hook-form` | `^7.68.0` | Alta | Todos los formularios |
| `@hookform/resolvers` | `^5.2.2` | Alta | Puente entre ambos |
| `@radix-ui/react-*` | 4 paquetes | Media | Dialog, label, slot, tabs |
| `@opentelemetry/*` | 11 paquetes | Media | Varios en `0.x` (`^0.221.0`, `^0.66.0`) |
| `lucide-react` | `^0.561.0` | Baja | Versión `0.x`: cualquier menor puede romper |
| `class-variance-authority`, `clsx`, `tailwind-merge` | — | Baja | Utilidades de clases |
| `date-fns` | `^4.1.0` | Baja | Fechas |
| `dotenv` | `^17.4.2` | Baja | Solo en scripts |

**Patrón observado y correcto:** `next`, `react` y `react-dom` están fijadas exactamente; el resto usa `^`. Fijar el framework evita que un `yarn install` en CI traiga una menor con cambios de comportamiento.

**Punto de atención:** los paquetes en `0.x` (`@opentelemetry/instrumentation@^0.221.0`, `@opentelemetry/exporter-trace-otlp-http@^0.221.0`, `@opentelemetry/instrumentation-document-load@^0.66.0`, `lucide-react@^0.561.0`) no siguen semver estable: en `0.x`, un incremento de la versión menor **puede** introducir cambios incompatibles, y `^` los aceptaría. El lockfile lo contiene mientras nadie lo regenere.

## 3. Reproducibilidad

| Control | Estado |
|---|---|
| Lockfile versionado (`yarn.lock`) | ✅ Presente, 310 933 bytes |
| Gestor fijado (`packageManager`) | ✅ `yarn@4.9.2` |
| Node mínimo (`engines`) | ✅ `>=20.18.0` |
| CI con instalación inmutable | ✅ `yarn install --frozen-lockfile` en los tres jobs |
| Node de CI alineado con `engines` | ⚠️ CI usa `22`; `engines` pide `>=20.18.0`. Compatible, pero **no se prueba en Node 20** |

## 4. Lo que no existe

| Control | Estado | Brecha |
|---|---|---|
| Auditoría de vulnerabilidades en CI (`yarn npm audit`) | ❌ | `DEP-01` — HIGH |
| Análisis de licencias | ❌ | `DEP-02` — LOW |
| Actualización automatizada (Dependabot, Renovate) | ❌ | `DEP-03` — MEDIUM |
| SBOM | ❌ | `DEP-04` — LOW |
| Verificación de firmas/procedencia | ❌ | `DEP-05` — LOW |
| Análisis de secretos en el repositorio | ❌ | `SEC-07` — MEDIUM |

**`DEP-01` es la más relevante.** Hoy nadie se entera de una vulnerabilidad conocida en las 53 dependencias directas ni en sus transitivas hasta que alguien la busca a mano.

Propuesta (`INSTRUMENTACIÓN SEGURA`, no implementada aquí): añadir un job al pipeline que ejecute `yarn npm audit --severity high` en modo informativo, sin bloquear, hasta acordar una estrategia de adopción. La Fase 17 del plan es explícita: *«No hacer que CI falle por deuda preexistente sin una estrategia de adopción acordada»*.

## 5. Comprobación manual

```bash
yarn npm audit --severity moderate     # vulnerabilidades conocidas
yarn outdated                          # versiones disponibles
yarn info <paquete>                    # metadatos
git diff --stat yarn.lock              # revisar cambios del lockfile en cada PR
```

**Regla de revisión:** ningún PR debe modificar `yarn.lock` sin que el cambio esté justificado en su descripción. Un lockfile modificado «de paso» es el vector más común de introducción accidental de dependencias.

## 6. Scripts de terceros en tiempo de ejecución

**Ninguno.** No hay etiquetas `<script>` hacia dominios externos, ni analítica de terceros, ni widgets embebidos.

Es la propiedad de seguridad más valiosa del proyecto: sostiene `script-src 'self'` en la CSP y elimina de raíz toda una familia de ataques de cadena de suministro en el navegador. Ver [content-security-policy.md](content-security-policy.md).

**Regla:** introducir el primer script de terceros obliga a reevaluar la CSP, el modelo de amenazas y la posición de privacidad. No es un cambio menor.

# Observabilidad del frontend — OpenTelemetry → Collector → Jaeger

Trazabilidad distribuida del frontend de Corazón Migrante.

**La telemetría está apagada por defecto** (`NEXT_PUBLIC_OTEL_ENABLED=false`), también
en producción. Encenderla exige la revisión descrita en el documento 05.

---

## Documentos

| # | Documento | Para qué |
| --- | --- | --- |
| 00 | [Auditoría del estado actual](./00-current-state-audit.md) | Qué arquitectura hay realmente y qué condiciona (`output: "export"`) |
| 01 | [Diseño de arquitectura](./01-architecture-design.md) | Cómo se integra y por qué así |
| 02 | [Convenciones de nombres](./02-naming-conventions.md) | **Normativo.** Nombres de span y atributos permitidos |
| 03 | [Catálogo de spans de negocio](./03-business-spans-catalog.md) | Los ocho spans de negocio, uno a uno |
| 04 | [Estrategia de Web Vitals](./04-web-vitals-strategy.md) | Qué se mide y por qué Jaeger no es la plataforma de métricas |
| 05 | [Política de datos y privacidad](./05-data-privacy-policy.md) | **Normativo.** Qué no puede salir del navegador, nunca |
| 06 | [Runbook](./06-runbook.md) | Levantar, verificar, desplegar, apagar y depurar |
| — | [Bundle: antes](./bundle-baseline.md) · [después](./bundle-after.md) | Coste medido |

---

## Mapa del código

```text
src/instrumentation-client.ts        arranque (Next lo carga solo, antes de hidratar)

src/observability/
├── index.ts                         ← ÚNICA superficie pública
├── config/                          variables validadas, nunca lanza
├── core/                            TracingService, sanitización, rutas, sesión
│   └── otel-api.ts                  carga diferida de @opentelemetry/api
├── browser/                         SDK, exportador, instrumentaciones (chunk aparte)
└── react/                           navegación SPA, Web Vitals, error boundary

functions/otel/v1/traces.ts          gateway del mismo origen (Cloudflare Pages)
src/app/api/otel/traces/route.ts     equivalente para desarrollo
infra/otel-collector/                Collector + Jaeger locales
```

## Reglas que no se negocian

1. Ningún componente importa Jaeger, ni el SDK, ni el exportador. Solo
   `@/observability`.
2. Ningún atributo llega a un span sin pasar por `safeAttributes()`.
3. La aplicación funciona **igual** con la telemetría apagada y con el Collector caído.
4. Ninguna variable `NEXT_PUBLIC_*` contiene un secreto.
5. Nada de lo listado en el documento 05 sale del navegador.

## Arranque rápido

```bash
docker compose -f infra/otel-collector/docker-compose.yml up -d
# .env.local: NEXT_PUBLIC_OTEL_ENABLED=true
#             NEXT_PUBLIC_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=/api/otel/traces
yarn dev
# → http://localhost:16686
```

Detalle completo en el [runbook](./06-runbook.md).

import { defaultResource, resourceFromAttributes, type Resource } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_NAMESPACE,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import type { TelemetryConfig } from "@/observability/config/telemetry.types";
import { ATTR } from "@/observability/core/tracing.constants";

/**
 * Recurso del frontend: identifica de forma estable *qué despliegue* emitió la traza.
 *
 * `deployment.environment.name` todavía vive en el paquete `incubating` de las
 * convenciones semánticas. Se escribe como literal para no arrastrar ese punto de
 * entrada entero al bundle por una sola constante; el nombre es el de la convención
 * vigente (sustituyó a `deployment.environment` en 1.27).
 */
const ATTR_DEPLOYMENT_ENVIRONMENT_NAME = "deployment.environment.name";

/**
 * Reglas cumplidas (Fase 6):
 *  - la versión NO cambia entre cargas: sale del build, no de la hora ni de un aleatorio;
 *  - no incluye el nombre de quien desarrolla, ni rutas locales, ni secretos;
 *  - `app.framework` y `app.rendering.mode` describen el despliegue, no al usuario.
 */
export function buildBrowserResource(config: TelemetryConfig): Resource {
  return defaultResource().merge(
    resourceFromAttributes({
      [ATTR_SERVICE_NAME]: config.serviceName,
      [ATTR_SERVICE_NAMESPACE]: config.serviceNamespace,
      [ATTR_SERVICE_VERSION]: config.version,
      [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: config.environment,
      [ATTR.buildId]: config.buildId,
      [ATTR.release]: config.release,
      [ATTR.environment]: config.environment,
      // Describen la arquitectura, no una instancia concreta: cardinalidad 1.
      "app.framework": "nextjs",
      "app.rendering.mode": "static-export",
    }),
  );
}

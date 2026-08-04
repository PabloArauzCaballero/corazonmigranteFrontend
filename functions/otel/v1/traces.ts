/**
 * Gateway de telemetría del mismo origen (Fase 31, opción A).
 *
 * `next.config.ts` usa `output: "export"`: no hay servidor Next.js en producción, así
 * que un Route Handler no serviría. Cloudflare Pages sí despliega funciones desde este
 * directorio junto al artefacto estático, y es el único mecanismo de mismo origen
 * disponible en este despliegue.
 *
 *   Navegador ──POST /otel/v1/traces──► esta función ──► OTEL_COLLECTOR_TRACES_URL
 *
 * Consecuencias buscadas:
 *  - el navegador nunca conoce la dirección del Collector,
 *  - no hay CORS ni preflight para la telemetría,
 *  - `connect-src 'self'` basta en la CSP,
 *  - no hay ningún secreto en JavaScript: la URL del Collector es una variable de
 *    entorno del servidor de Pages, invisible para el cliente.
 *
 * Tipos declarados a mano en vez de depender de `@cloudflare/workers-types`: es una
 * única firma y añadir el paquete arrastraría los tipos globales de Workers a todo el
 * proyecto, pisando los del DOM.
 */

type PagesEnv = {
  /** URL completa del endpoint OTLP del Collector, p. ej. `http://otel-collector:4318/v1/traces`. */
  readonly OTEL_COLLECTOR_TRACES_URL?: string;
};

type PagesContext = {
  readonly request: Request;
  readonly env: PagesEnv;
};

/** Lote máximo aceptado. El exportador del navegador manda como mucho 64 spans. */
const MAX_BODY_BYTES = 512 * 1024;

/** Tiempo máximo esperando al Collector. Pasado eso, se responde igual. */
const COLLECTOR_TIMEOUT_MS = 5_000;

/**
 * Respuesta neutra.
 *
 * Siempre `202 Accepted`, incluso si el Collector está caído. El navegador no debe
 * reintentar ni distinguir entre "recibido" y "reenviado": un error aquí solo lograría
 * que el SDK reintentara y saturara la red de quien está usando la aplicación.
 */
function accepted(): Response {
  return new Response(null, { status: 202 });
}

function rejected(status: number): Response {
  return new Response(null, { status });
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const { request, env } = context;

  // Solo OTLP/HTTP en JSON, que es lo que exporta este frontend.
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return rejected(415);
  }

  // Límite declarado: rechaza antes de leer nada.
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_BODY_BYTES) {
    return rejected(413);
  }

  const collectorUrl = env.OTEL_COLLECTOR_TRACES_URL;
  if (!collectorUrl) {
    // Sin Collector configurado el gateway es un sumidero silencioso. Es el estado
    // correcto de un despliegue que todavía no tiene infraestructura de trazas.
    return accepted();
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return rejected(400);
  }

  // Límite real: `content-length` puede faltar o mentir.
  if (body.length > MAX_BODY_BYTES) {
    return rejected(413);
  }

  try {
    // El cuerpo NUNCA se registra ni se inspecciona: son trazas, y aunque estén
    // saneadas en origen, este punto no debe convertirse en un almacén de datos.
    await fetch(collectorUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      signal: AbortSignal.timeout(COLLECTOR_TIMEOUT_MS),
    });
  } catch {
    // Collector caído, lento o inalcanzable: se descarta el lote en silencio.
  }

  return accepted();
}

/**
 * Preflight. En la práctica no ocurre —el endpoint es del mismo origen y el
 * `content-type` es simple—, pero si alguien despliega el frontend en un subdominio
 * distinto, la respuesta correcta es un rechazo explícito y no un fallo silencioso.
 */
export function onRequestOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      allow: "POST, OPTIONS",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
    },
  });
}

/** Cualquier otro método se rechaza: no hay nada que leer aquí. */
export function onRequest(): Response {
  return new Response(null, { status: 405, headers: { allow: "POST, OPTIONS" } });
}

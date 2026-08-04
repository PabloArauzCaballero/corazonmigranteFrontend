import { NextResponse, type NextRequest } from "next/server";

/**
 * Equivalente del gateway de telemetría **para desarrollo local**.
 *
 * En producción el proxy es la Cloudflare Pages Function `functions/otel/v1/traces.ts`:
 * con `output: "export"` no hay servidor Next.js y este Route Handler no llega al
 * artefacto publicado (igual que `/api/debug-log`, que ya sigue este patrón).
 *
 * Existe para que en local se pueda apuntar
 * `NEXT_PUBLIC_OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=/api/otel/traces` y probar el flujo
 * completo contra el Collector de `infra/otel-collector/docker-compose.yml` sin
 * necesidad de CORS ni de exponer el puerto 4318 al navegador.
 */

const MAX_BODY_BYTES = 512 * 1024;
const COLLECTOR_TIMEOUT_MS = 5_000;

/** URL del Collector. Variable **sin** prefijo `NEXT_PUBLIC_`: no viaja al navegador. */
function collectorUrl() {
  return process.env.OTEL_COLLECTOR_TRACES_URL ?? "http://localhost:4318/v1/traces";
}

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return new NextResponse(null, { status: 415 });
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return new NextResponse(null, { status: 400 });
  }

  if (body.length > MAX_BODY_BYTES) {
    return new NextResponse(null, { status: 413 });
  }

  try {
    // El cuerpo no se imprime nunca, ni siquiera en desarrollo: para inspeccionar
    // trazas está la interfaz de Jaeger, que es donde deben mirarse.
    await fetch(collectorUrl(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      signal: AbortSignal.timeout(COLLECTOR_TIMEOUT_MS)
    });
  } catch {
    // Sin Collector levantado, la aplicación debe seguir funcionando igual.
  }

  // Siempre 202: el navegador no debe reintentar ni ver errores de telemetría.
  return new NextResponse(null, { status: 202 });
}

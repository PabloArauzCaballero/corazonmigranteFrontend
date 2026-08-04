import type { Context } from "@opentelemetry/api";
import type { ReadableSpan, Span, SpanProcessor } from "@opentelemetry/sdk-trace-base";
import { REDACTED, containsSensitiveData, sanitizeUrlPath } from "@/observability/core/sanitize";

/**
 * Última barrera antes de exportar.
 *
 * `safeAttributes()` protege los atributos que escribe **código propio**, pero las
 * instrumentaciones oficiales escriben los suyos directamente. En concreto,
 * `FetchInstrumentation` pone `url.full` con la **URL completa, query string
 * incluida**. En este proyecto eso filtraría:
 *
 *  - las URL firmadas de Cloudinary (`uploadUrl` con `signature`, `api_key`…),
 *  - cualquier `?search=` escrito por una persona,
 *  - el `?token=<JWT>` del stream de notificaciones si algún día pasa por `fetch`.
 *
 * Este procesador envuelve al `BatchSpanProcessor` y reescribe esos atributos en
 * `onEnd`, justo antes de que el span entre en la cola de exportación.
 */

/** Atributos cuyo valor es una URL y deben quedarse solo con el camino. */
const URL_ATTRIBUTES: readonly string[] = ["url.full", "http.url", "url.query", "http.target"];

/** Atributos que nunca deben salir del navegador, escríbalos quien los escriba. */
const FORBIDDEN_ATTRIBUTES: readonly string[] = [
  "http.request.header.authorization",
  "http.request.header.cookie",
  "http.response.header.set-cookie",
  "http.request.body",
  "http.response.body",
  "url.fragment",
];

function scrub(attributes: Record<string, unknown>) {
  for (const key of FORBIDDEN_ATTRIBUTES) {
    if (key in attributes) delete attributes[key];
  }

  for (const key of URL_ATTRIBUTES) {
    const value = attributes[key];
    if (typeof value === "string") {
      attributes[key] = sanitizeUrlPath(value);
    }
  }

  // Barrido general: cualquier valor de texto que contenga un correo, un JWT, un
  // teléfono o una secuencia larga de dígitos se sustituye entero.
  for (const [key, value] of Object.entries(attributes)) {
    if (typeof value === "string" && containsSensitiveData(value)) {
      attributes[key] = REDACTED;
    }
  }
}

export class SanitizingSpanProcessor implements SpanProcessor {
  constructor(private readonly delegate: SpanProcessor) {}

  onStart(span: Span, parentContext: Context): void {
    this.delegate.onStart(span, parentContext);
  }

  onEnd(span: ReadableSpan): void {
    // `attributes` es un objeto plano en la implementación del SDK; se reescribe en
    // el sitio porque `ReadableSpan` no expone una API para eliminar atributos.
    scrub(span.attributes as Record<string, unknown>);

    for (const event of span.events) {
      if (event.attributes) scrub(event.attributes as Record<string, unknown>);
    }

    this.delegate.onEnd(span);
  }

  shutdown(): Promise<void> {
    return this.delegate.shutdown();
  }

  forceFlush(): Promise<void> {
    return this.delegate.forceFlush();
  }
}

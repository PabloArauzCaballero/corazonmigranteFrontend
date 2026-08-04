import { addEvent, runInSpan, startSpan } from "@/observability/core/tracing.service";
import { ATTR, TECHNICAL_SPANS, UI_RESULT } from "@/observability/core/tracing.constants";
import { boundedCount } from "@/observability/core/sanitize";

/**
 * Instrumentación de formularios (Fase 16).
 *
 * Mide **el proceso**, nunca el contenido:
 *
 *  - se registra que hubo un intento de envío,
 *  - si la validación pasó o no, y **cuántos** campos fallaron,
 *  - si la operación remota terminó bien, mal o se canceló,
 *  - cuánto tardó todo.
 *
 * Lo que jamás se registra: el nombre de los campos que fallaron, sus valores, los
 * mensajes de validación ni ninguna serialización del formulario. Saber que fallaron
 * tres campos es diagnóstico; saber cuáles y con qué valores, en un producto de salud
 * mental, es un dato clínico.
 */

export type FormTracingContext = {
  /** Identificador estable del formulario. Literal, nunca construido con datos. */
  readonly formName: string;
  readonly feature: string;
  readonly operation: string;
  /** Nombre del componente. Literal. */
  readonly component: string;
};

function baseAttributes(context: FormTracingContext) {
  return {
    [ATTR.uiFormName]: context.formName,
    [ATTR.feature]: context.feature,
    [ATTR.operation]: context.operation,
    [ATTR.uiComponent]: context.component,
    [ATTR.uiAction]: "submit",
  };
}

/**
 * Envuelve el envío válido de un formulario.
 *
 * La operación debe lanzar su llamada de red antes del primer `await` para que el span
 * HTTP quede colgando de este. Ver la nota sobre contexto asíncrono en
 * `tracing.service.ts`.
 */
export function traceFormSubmit<T>(context: FormTracingContext, submit: () => Promise<T> | T): Promise<T> {
  return runInSpan(TECHNICAL_SPANS.uiInteraction, baseAttributes(context), async (span) => {
    addEvent("validation.completed", { [ATTR.validationSuccess]: true });

    try {
      const result = await submit();
      span.setAttributes({ [ATTR.validationSuccess]: true, [ATTR.uiResult]: UI_RESULT.success });
      return result;
    } catch (error) {
      span.setAttributes({ [ATTR.validationSuccess]: true, [ATTR.uiResult]: UI_RESULT.error });
      throw error;
    }
  });
}

/**
 * Registra un envío bloqueado por la validación del cliente.
 *
 * Recibe el **número** de campos con error, nunca los campos. Quien llama debe pasar
 * `Object.keys(errors).length`, no `errors`.
 */
export function traceFormValidationFailure(context: FormTracingContext, errorCount: number): void {
  const span = startSpan(TECHNICAL_SPANS.uiInteraction, {
    ...baseAttributes(context),
    [ATTR.validationSuccess]: false,
    [ATTR.validationErrorCount]: boundedCount(errorCount),
    [ATTR.uiResult]: UI_RESULT.error,
  });
  span.end();
}

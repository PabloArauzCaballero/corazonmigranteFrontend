"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportReactError } from "@/observability/react/react-error-reporter";
import { REACT_ERROR_BOUNDARIES, type ReactErrorBoundaryName } from "@/observability/react/react-error.types";

/**
 * Límite de error **opcional** para envolver una funcionalidad concreta.
 *
 * Los `error.tsx` de Next ya cubren cada segmento de ruta; este componente existe para
 * los casos en que se quiere aislar una parte de la pantalla (una tabla, un panel) sin
 * tumbar la ruta entera. No sustituye a nada existente.
 *
 * La interfaz de recuperación la decide quien lo usa (`fallback`): el módulo de
 * observabilidad no impone diseño.
 */

type Props = {
  readonly children: ReactNode;
  /** Qué se muestra si falla. Si no se indica, no se pinta nada. */
  readonly fallback?: ReactNode;
  /** Nombre estático del límite. Nunca una cadena construida con datos. */
  readonly boundary?: ReactErrorBoundaryName;
};

type State = { readonly hasError: boolean };

export class TelemetryErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // `info.componentStack` está disponible y se descarta a propósito: puede contener
    // nombres de componentes generados con datos. Ver `react-error-reporter.ts`.
    void info;
    reportReactError(error, this.props.boundary ?? REACT_ERROR_BOUNDARIES.feature);
  }

  render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}

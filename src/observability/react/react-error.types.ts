/**
 * Nombres de los límites de error del proyecto.
 *
 * Son **literales estáticos**, nunca cadenas construidas: es lo que mantiene acotada
 * la cardinalidad de `ui.component` en los spans de error.
 */
export const REACT_ERROR_BOUNDARIES = {
  global: "GlobalErrorBoundary",
  public: "PublicErrorBoundary",
  admin: "AdminErrorBoundary",
  patient: "PatientErrorBoundary",
  therapist: "TherapistErrorBoundary",
  feature: "FeatureErrorBoundary",
} as const;

export type ReactErrorBoundaryName = (typeof REACT_ERROR_BOUNDARIES)[keyof typeof REACT_ERROR_BOUNDARIES];

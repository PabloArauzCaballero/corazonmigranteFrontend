import React from "react";
import AuthPacientePage from "../auth_paciente/pages/AuthPacientePage";

/**
 * PublicLoginPage
 * - Único login público (paciente) accesible desde la landing.
 * - Elimina el comportamiento duplicado que reutilizaba el AdminLoginPage.
 * - Navegación SPA: botón Volver retorna a la landing.
 */
export default function PublicLoginPage({ onBack }) {
  return <AuthPacientePage onBack={onBack} initialMode="login" />;
}

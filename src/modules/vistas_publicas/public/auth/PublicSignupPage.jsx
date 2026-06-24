import React from "react";
import AuthPacientePage from "../auth_paciente/pages/AuthPacientePage";

export default function PublicSignupPage({ onBack, onGoLogin }) {
  return (
    <AuthPacientePage
      onBack={onBack}
      onGoLogin={onGoLogin}
      initialMode="register"
    />
  );
}

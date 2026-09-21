import type { Metadata } from "next";
import { PasswordResetForm } from "@/features/auth/password-reset-form";
import { AuthVisualLayout } from "@/shared/ui/auth-visual-layout";

export const metadata: Metadata = {
  title: "Recuperar contraseña",
  description: "Recupera el acceso a tu cuenta de Corazón Migrante con un código enviado a tu correo.",
  robots: { index: false, follow: false }
};

export default function PasswordResetPage() {
  return (
    <AuthVisualLayout title="Recupera el acceso a tu cuenta.">
      <PasswordResetForm />
    </AuthVisualLayout>
  );
}

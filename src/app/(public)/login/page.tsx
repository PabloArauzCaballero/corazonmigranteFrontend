import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/login-form";
import { AuthVisualLayout } from "@/shared/ui/auth-visual-layout";

export const metadata: Metadata = {
  title: "Ingresar",
  description: "Accede a tu cuenta de Corazón Migrante para gestionar tus sesiones de terapia.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <AuthVisualLayout title="Ingresa a un espacio privado y acompañado.">
      <LoginForm />
    </AuthVisualLayout>
  );
}

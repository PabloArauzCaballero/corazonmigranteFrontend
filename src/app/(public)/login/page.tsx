import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/login-form";
import { AuthVisualLayout } from "@/shared/ui/auth-visual-layout";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <AuthVisualLayout title="Ingresa a un espacio privado y acompañado.">
      <LoginForm />
    </AuthVisualLayout>
  );
}

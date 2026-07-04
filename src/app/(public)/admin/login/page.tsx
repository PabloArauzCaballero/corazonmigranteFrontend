import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/login-form";
import { AuthVisualLayout } from "@/shared/ui/auth-visual-layout";

export const metadata: Metadata = { title: "Ingreso administrativo" };

export default function AdminLoginPage() {
  return (
    <AuthVisualLayout eyebrow="Portal administrativo" title="Gestión clínica con orden, permisos y trazabilidad.">
      <LoginForm defaultRole="ADMIN" title="Ingreso administrativo" />
    </AuthVisualLayout>
  );
}

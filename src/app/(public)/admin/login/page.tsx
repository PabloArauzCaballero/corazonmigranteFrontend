import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Ingreso administrativo" };

export default function AdminLoginPage() {
  return (
    <section className="container flex min-h-screen items-center py-16">
      <LoginForm defaultRole="ADMIN" title="Ingreso administrativo" />
    </section>
  );
}

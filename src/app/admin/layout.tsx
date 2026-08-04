import type { Metadata } from "next";
import { ClientRoleGuard } from "@/shared/auth/guard";
import { DashboardShell, adminNav } from "@/features/dashboard/sidebar";

// El HTML del panel se exporta estáticamente y es alcanzable sin sesión (el contenido
// sí requiere token). Se marca noindex para que no acabe en resultados de búsqueda;
// public/_headers añade además el X-Robots-Tag a nivel de respuesta.
export const metadata: Metadata = {
  title: "Panel admin",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientRoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "CONTADOR"]} loginPath="/admin/login">
      <DashboardShell navItems={adminNav} title="Panel admin" showNotifications>{children}</DashboardShell>
    </ClientRoleGuard>
  );
}

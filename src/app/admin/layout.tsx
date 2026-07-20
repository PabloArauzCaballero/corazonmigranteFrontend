import { ClientRoleGuard } from "@/shared/auth/guard";
import { DashboardShell, adminNav } from "@/features/dashboard/sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientRoleGuard allowedRoles={["ADMIN", "SUPER_ADMIN", "CONTADOR"]} loginPath="/admin/login">
      <DashboardShell navItems={adminNav} title="Panel admin" showNotifications>{children}</DashboardShell>
    </ClientRoleGuard>
  );
}

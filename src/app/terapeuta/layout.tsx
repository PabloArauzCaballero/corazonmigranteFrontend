import { ClientRoleGuard } from "@/shared/auth/guard";
import { DashboardShell, therapistNav } from "@/features/dashboard/sidebar";

export default function TherapistLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientRoleGuard allowedRoles={["TERAPEUTA"]} loginPath="/admin/login">
      <DashboardShell navItems={therapistNav} title="Portal terapeuta">{children}</DashboardShell>
    </ClientRoleGuard>
  );
}

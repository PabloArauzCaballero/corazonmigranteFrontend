import { ClientRoleGuard } from "@/shared/auth/guard";
import { DashboardShell, patientNav } from "@/features/dashboard/sidebar";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientRoleGuard allowedRoles={["PACIENTE"]} loginPath="/login">
      <DashboardShell navItems={patientNav} title="Portal paciente">{children}</DashboardShell>
    </ClientRoleGuard>
  );
}

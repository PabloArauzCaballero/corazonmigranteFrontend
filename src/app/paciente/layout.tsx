import type { Metadata } from "next";
import { ClientRoleGuard } from "@/shared/auth/guard";
import { DashboardShell, patientNav } from "@/features/dashboard/sidebar";

// Portal privado: nunca debe indexarse. Ver también public/_headers.
export const metadata: Metadata = {
  title: "Portal paciente",
  robots: { index: false, follow: false },
};

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientRoleGuard allowedRoles={["PACIENTE"]} loginPath="/login">
      <DashboardShell navItems={patientNav} title="Portal paciente">{children}</DashboardShell>
    </ClientRoleGuard>
  );
}

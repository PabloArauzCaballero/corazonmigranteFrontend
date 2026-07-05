import { UsersTable } from "@/features/users/users-table";
import { PageHeader } from "@/shared/ui/page-header";

export default function AdminUsersPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Usuarios" description="Gestion de pacientes, terapeutas y roles administrativos segun contratos disponibles del backend." />
      <UsersTable />
    </div>
  );
}

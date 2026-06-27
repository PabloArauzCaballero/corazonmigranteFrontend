import { UsersTable } from "@/features/users/users-table";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

export default function AdminUsersPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Usuarios" description="Módulo unificado para pacientes, terapeutas, administradores y contabilidad. Sin formularios duplicados." actions={<Button>Crear usuario</Button>} />
      <UsersTable />
    </div>
  );
}

import { UsersTable } from "@/features/users/users-table";
import { PageHeader } from "@/shared/ui/page-header";

export default function AdminUsersPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Personas registradas" description="Aquí ves a todas las personas que usan el sistema: pacientes, terapeutas y administradores. Puedes buscar a alguien, revisar sus datos y cambiar su estado." />
      <UsersTable />
    </div>
  );
}

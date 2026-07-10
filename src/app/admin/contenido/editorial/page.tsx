import { EditorialAdminPage } from "@/features/editorial/editorial-admin-page";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = {
  title: "Páginas públicas | Admin Corazón Migrante"
};

export default function AdminEditorialPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Biblioteca y recursos públicos" description="Aquí administras los recursos y páginas de comunicación que ve el público, de forma simple y sin detalles técnicos." />
      <EditorialAdminPage />
    </div>
  );
}

import { EditorialAdminPage } from "@/features/editorial/editorial-admin-page";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = {
  title: "Páginas públicas | Admin Corazón Migrante"
};

export default function AdminEditorialPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Páginas públicas" description="Administra páginas, recursos y comunicación pública sin exponer detalles técnicos." />
      <EditorialAdminPage />
    </div>
  );
}

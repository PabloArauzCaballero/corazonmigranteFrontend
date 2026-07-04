import { EditorialAdminPage } from "@/features/editorial/editorial-admin-page";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = {
  title: "CMS editorial | Admin Corazón Migrante"
};

export default function AdminEditorialPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Contenido editorial" description="Módulo de biblioteca, recursos y comunicación pública." />
      <EditorialAdminPage />
    </div>
  );
}

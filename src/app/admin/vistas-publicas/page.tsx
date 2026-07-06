import { PublicContentTable } from "@/features/public-content/public-content-table";
import { AdminPublicPreview } from "@/features/public-view/admin-public-preview";
import { PageHeader } from "@/shared/ui/page-header";

export default function PublicViewsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Vistas públicas"
        description="Previsualiza cómo se ven las páginas públicas sin salir del panel (la navegación lateral se mantiene) y administra los elementos del CMS."
      />
      <AdminPublicPreview />
      <PublicContentTable />
    </div>
  );
}

import { PublicContentTable } from "@/features/public-content/public-content-table";
import { AdminPublicPreview } from "@/features/public-view/admin-public-preview";
import { PageHeader } from "@/shared/ui/page-header";

export default function PublicViewsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Páginas públicas"
        description="Previsualiza cómo se ven las páginas públicas sin salir del panel y administra sus publicaciones y bloques de contenido."
      />
      <AdminPublicPreview />
      <PublicContentTable />
    </div>
  );
}

import { PublicContentTable } from "@/features/public-content/public-content-table";
import { AdminPublicPreview } from "@/features/public-view/admin-public-preview";
import { PageHeader } from "@/shared/ui/page-header";

export default function PublicViewsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Vista previa del sitio web"
        description="Aquí puedes ver cómo se ve el sitio web que visitan las personas (sin salir de este panel) y administrar el contenido que aparece en cada página."
      />
      <AdminPublicPreview />
      <PublicContentTable />
    </div>
  );
}

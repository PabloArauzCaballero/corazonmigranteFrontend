import { PublicContentTable } from "@/features/public-content/public-content-table";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

export default function PublicViewsPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Vistas públicas" description="CMS simple para textos, imágenes, orden y visibilidad de secciones públicas." actions={<Button>Crear elemento</Button>} />
      <PublicContentTable />
    </div>
  );
}

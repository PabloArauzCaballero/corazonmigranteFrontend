import { CatalogTable } from "@/features/products/products-table";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

export default function ApproachesPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Enfoques terapéuticos" description="Administración de enfoques conectada al backend con paginación real." actions={<Button>Crear enfoque</Button>} />
      <CatalogTable kind="approaches" />
    </div>
  );
}

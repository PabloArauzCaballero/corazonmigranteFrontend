import { CatalogTable } from "@/features/products/products-table";
import { PageHeader } from "@/shared/ui/page-header";

export default function ApproachesPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Enfoques terapéuticos" description="Administración de enfoques conectada al sistema con paginación real." />
      <CatalogTable kind="approaches" />
    </div>
  );
}

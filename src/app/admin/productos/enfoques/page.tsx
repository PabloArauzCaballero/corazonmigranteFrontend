import { CatalogTable } from "@/features/products/products-table";
import { PageHeader } from "@/shared/ui/page-header";

export default function ApproachesPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Enfoques terapéuticos" description="Los enfoques son los distintos tipos de terapia que ofrece Corazón Migrante (por ejemplo: individual, familiar, de pareja). Aquí puedes ver y administrar la lista." />
      <CatalogTable kind="approaches" />
    </div>
  );
}

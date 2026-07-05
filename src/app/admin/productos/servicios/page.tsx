import { CatalogTable } from "@/features/products/products-table";
import { PageHeader } from "@/shared/ui/page-header";

export default function ServicesPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Servicios" description="Servicios/productos asociados a terapia y booking, consultados desde el sistema." />
      <CatalogTable kind="services" />
    </div>
  );
}

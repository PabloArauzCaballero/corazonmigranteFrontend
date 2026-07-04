import { CatalogTable } from "@/features/products/products-table";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

export default function ServicesPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Servicios" description="Servicios/productos asociados a terapia y booking, consultados desde el sistema." actions={<Button>Crear servicio</Button>} />
      <CatalogTable kind="services" />
    </div>
  );
}

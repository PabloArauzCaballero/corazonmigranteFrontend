import { CatalogTable } from "@/features/products/products-table";
import { PageHeader } from "@/shared/ui/page-header";

export default function ServicesPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Servicios" description="Aquí administras los servicios que los pacientes pueden reservar, como las sesiones de terapia disponibles y su precio." />
      <CatalogTable kind="services" />
    </div>
  );
}

import { CatalogTable } from "@/features/products/products-table";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

const rows = [
  { id: "p-1", name: "Orientación inicial", type: "Servicio", status: "activo" as const },
  { id: "p-2", name: "Acompañamiento psicológico", type: "Servicio", status: "activo" as const }
];

export default function ServicesPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Servicios" description="Servicios/productos asociados a terapia y booking." actions={<Button>Crear servicio</Button>} />
      <CatalogTable rows={rows} />
    </div>
  );
}

import { CatalogTable } from "@/features/products/products-table";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";

const rows = [
  { id: "e-1", name: "Migración y adaptación", type: "Enfoque", status: "activo" as const },
  { id: "e-2", name: "Vínculos familiares", type: "Enfoque", status: "activo" as const }
];

export default function ApproachesPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Enfoques terapéuticos" description="Administración de enfoques. Las imágenes/archivos deben subir vía FormData validado." actions={<Button>Crear enfoque</Button>} />
      <CatalogTable rows={rows} />
    </div>
  );
}

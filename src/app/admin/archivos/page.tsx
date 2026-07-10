import { FilesAdmin } from "@/features/files/files-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Archivos | Admin Corazón Migrante" };

export default function AdminArchivosPage() {
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Archivos" title="Imágenes y documentos" description="Aquí se guardan todas las imágenes y documentos que se suben al sistema. Puedes ver la lista, subir archivos nuevos o borrar los que ya no se usan." />
      <FilesAdmin />
    </div>
  );
}

import { FilesAdmin } from "@/features/files/files-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Archivos | Admin Corazón Migrante" };

export default function AdminArchivosPage() {
  return (
    <div className="grid gap-6">
      <PageHeader eyebrow="Archivos" title="Gestión de archivos" description="Lista, sube, modifica y elimina archivos vinculados a GCS o almacenamiento local." />
      <FilesAdmin />
    </div>
  );
}

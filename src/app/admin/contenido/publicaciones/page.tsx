import { PublicationsAdmin } from "@/features/newsroom/newsroom-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Publicaciones | Admin Corazón Migrante" };

export default function AdminPublicacionesPage() {
  return <div className="grid gap-6"><PageHeader eyebrow="Contenido" title="Publicaciones" description="Noticias, columnas, reportes y piezas editoriales gestionadas por el sistema de Corazón Migrante." /><PublicationsAdmin /></div>;
}

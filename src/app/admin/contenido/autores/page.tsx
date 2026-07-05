import { AuthorsAdmin } from "@/features/newsroom/newsroom-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Autores | Admin Corazón Migrante" };

export default function AdminAutoresPage() {
  return <div className="grid gap-6"><PageHeader eyebrow="Contenido" title="Autores" description="Perfiles editoriales para firmar noticias, columnas y análisis." /><AuthorsAdmin /></div>;
}

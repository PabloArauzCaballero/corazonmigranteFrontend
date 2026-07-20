import { AuthorsAdmin } from "@/features/newsroom/newsroom-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Autores | Admin Corazón Migrante" };

export default function AdminAutoresPage() {
  return <div className="grid gap-6"><PageHeader eyebrow="Contenido" title="Autores" description="Aquí registras a las personas que firman las noticias y columnas que se publican, y puedes vincularlas a una cuenta de usuario ya existente." /><AuthorsAdmin /></div>;
}

import { PublicationsAdmin } from "@/features/newsroom/newsroom-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Publicaciones | Admin Corazón Migrante" };

export default function AdminPublicacionesPage() {
  return <div className="grid gap-6"><PageHeader eyebrow="Contenido" title="Publicaciones" description="Aquí escribes y administras las noticias, columnas y reportes que se muestran en el sitio web. Puedes crear una nueva, editarla o publicarla cuando esté lista." /><PublicationsAdmin /></div>;
}

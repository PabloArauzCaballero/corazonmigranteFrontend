import { PublicationsAdmin } from "@/features/newsroom/newsroom-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Contenido Público | Admin Corazón Migrante" };

export default function AdminContenidoPublicoPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Contenido"
        title="Contenido Público"
        description="Aquí administras las noticias y columnas del sitio: puedes crearlas, editarlas, publicarlas o archivarlas, y decidir si son de acceso público o premium."
      />
      <PublicationsAdmin />
    </div>
  );
}

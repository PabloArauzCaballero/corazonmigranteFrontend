import { PublicationsAdmin } from "@/features/newsroom/newsroom-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Contenido Público | Admin Corazón Migrante" };

export default function AdminContenidoPublicoPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Contenido"
        title="Contenido Público"
        description="Gestiona publicaciones públicas y premium, tipos, categorías, páginas relacionadas y estado editorial."
      />
      <PublicationsAdmin />
    </div>
  );
}

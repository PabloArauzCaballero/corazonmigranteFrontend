import { DownloadablesAdmin } from "@/features/downloadables/downloadables-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Descargables | Admin Corazón Migrante" };

export default function AdminDownloadablesPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Contenido"
        title="Recursos descargables"
        description="Crea guías, audios y PDFs. Controla su visibilidad (público, premium, privado o compra), publica versiones inmutables y vincula productos de Hotmart."
      />
      <DownloadablesAdmin />
    </div>
  );
}

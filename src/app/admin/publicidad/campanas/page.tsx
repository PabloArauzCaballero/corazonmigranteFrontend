import { AdsCampaignsAdmin } from "@/features/newsroom/newsroom-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Campañas publicitarias | Admin Corazón Migrante" };

export default function AdminPublicidadCampanasPage() {
  return <div className="grid gap-6"><PageHeader eyebrow="Publicidad" title="Campañas publicitarias" description="Campañas vinculadas a publicaciones, ubicaciones y páginas públicas." /><AdsCampaignsAdmin /></div>;
}

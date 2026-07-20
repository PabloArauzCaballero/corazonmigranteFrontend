import { AdsCampaignsAdmin } from "@/features/newsroom/newsroom-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Campañas publicitarias | Admin Corazón Migrante" };

export default function AdminPublicidadCampanasPage() {
  return <div className="grid gap-6"><PageHeader eyebrow="Publicidad" title="Campañas publicitarias" description="Una campaña agrupa los anuncios de una empresa durante un periodo de tiempo. Aquí la creas y eliges en qué noticias o páginas se mostrará." /><AdsCampaignsAdmin /></div>;
}

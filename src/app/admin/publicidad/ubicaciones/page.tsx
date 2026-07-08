import { AdsPlacementsAdmin } from "@/features/newsroom/newsroom-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Ubicaciones publicitarias | Admin Corazón Migrante" };

export default function AdminPublicidadUbicacionesPage() {
  return <div className="grid gap-6"><PageHeader eyebrow="Publicidad" title="Ubicaciones publicitarias" description="Espacios disponibles donde pueden mostrarse anuncios." /><AdsPlacementsAdmin /></div>;
}

import { AdvertisingAdmin } from "@/features/newsroom/newsroom-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Publicidad | Admin Corazón Migrante" };

export default function AdminPublicidadPage() {
  return <div className="grid gap-6"><PageHeader eyebrow="Publicidad" title="Gestión publicitaria" description="Empresas, ubicaciones, campañas y creativos absorbidos al panel de Corazón Migrante." /><AdvertisingAdmin /></div>;
}

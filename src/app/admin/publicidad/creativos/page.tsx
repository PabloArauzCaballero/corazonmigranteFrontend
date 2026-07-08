import { AdsCreativesAdmin } from "@/features/newsroom/newsroom-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Creativos publicitarios | Admin Corazón Migrante" };

export default function AdminPublicidadCreativosPage() {
  return <div className="grid gap-6"><PageHeader eyebrow="Publicidad" title="Creativos" description="Piezas gráficas asociadas a cada campaña." /><AdsCreativesAdmin /></div>;
}

import { AdsCreativesAdmin } from "@/features/newsroom/newsroom-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Creativos publicitarios | Admin Corazón Migrante" };

export default function AdminPublicidadCreativosPage() {
  return <div className="grid gap-6"><PageHeader eyebrow="Publicidad" title="Imágenes de los anuncios" description="Aquí subes las imágenes de un anuncio y las vinculas a la campaña donde se van a mostrar." /><AdsCreativesAdmin /></div>;
}

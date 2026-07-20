import { AdsPlacementsVisual } from "@/features/newsroom/ads-placements-visual";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Ubicaciones publicitarias | Admin Corazón Migrante" };

export default function AdminPublicidadUbicacionesPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Publicidad"
        title="Dónde se muestran los anuncios"
        description="Mapa visual de los espacios publicitarios del sitio. Los recuadros resaltados están activos; los grises están desactivados o no configurados aún."
      />
      <AdsPlacementsVisual />
    </div>
  );
}

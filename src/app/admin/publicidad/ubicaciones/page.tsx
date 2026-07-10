import { AdsPlacementsAdmin } from "@/features/newsroom/newsroom-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Ubicaciones publicitarias | Admin Corazón Migrante" };

export default function AdminPublicidadUbicacionesPage() {
  return <div className="grid gap-6"><PageHeader eyebrow="Publicidad" title="Dónde se muestran los anuncios" description="Aquí defines en qué partes del sitio web se puede poner un anuncio (por ejemplo: en el inicio o dentro de una noticia)." /><AdsPlacementsAdmin /></div>;
}

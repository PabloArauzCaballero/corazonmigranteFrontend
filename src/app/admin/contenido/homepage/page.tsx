import { HomepageAdmin } from "@/features/newsroom/newsroom-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Portada editorial | Admin Corazón Migrante" };

export default function AdminHomepagePage() {
  return <div className="grid gap-6"><PageHeader eyebrow="Contenido" title="Portada del sitio web" description="Aquí revisas qué noticias y columnas van a aparecer en la primera página que ven las visitas, antes de que se publiquen." /><HomepageAdmin /></div>;
}

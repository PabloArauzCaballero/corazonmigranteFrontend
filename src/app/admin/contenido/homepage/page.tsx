import { HomepageAdmin } from "@/features/newsroom/newsroom-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Portada editorial | Admin Corazón Migrante" };

export default function AdminHomepagePage() {
  return <div className="grid gap-6"><PageHeader eyebrow="Contenido" title="Portada editorial" description="Vista de validación para titulares, columnas y layout que alimentan la portada." /><HomepageAdmin /></div>;
}

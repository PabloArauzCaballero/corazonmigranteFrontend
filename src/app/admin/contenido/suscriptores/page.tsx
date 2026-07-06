import { SubscribersAdmin } from "@/features/newsroom/newsroom-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Suscriptores | Admin Corazón Migrante" };

export default function AdminSubscribersPage() {
  return <div className="grid gap-6"><PageHeader eyebrow="Contenido" title="Suscriptores premium" description="Gestiona quién tiene acceso a contenido premium." /><SubscribersAdmin /></div>;
}

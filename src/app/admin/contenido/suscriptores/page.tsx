import { SubscribersAdmin } from "@/features/newsroom/newsroom-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Suscriptores | Admin Corazón Migrante" };

export default function AdminSubscribersPage() {
  return <div className="grid gap-6"><PageHeader eyebrow="Contenido" title="Suscriptores premium" description="Aquí ves qué pacientes pidieron acceso al contenido premium (de pago), y decides a quién se lo das o se lo quitas." /><SubscribersAdmin /></div>;
}

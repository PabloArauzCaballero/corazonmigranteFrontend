import { AdsCompaniesAdmin } from "@/features/newsroom/newsroom-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Empresas anunciantes | Admin Corazón Migrante" };

export default function AdminPublicidadEmpresasPage() {
  return <div className="grid gap-6"><PageHeader eyebrow="Publicidad" title="Empresas anunciantes" description="Aquí registras a las empresas que quieren mostrar publicidad en el sitio web: su nombre, contacto y logo." /><AdsCompaniesAdmin /></div>;
}

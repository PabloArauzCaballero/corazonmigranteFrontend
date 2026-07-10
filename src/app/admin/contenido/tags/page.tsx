import { TagsAdmin } from "@/features/newsroom/newsroom-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Tags | Admin Corazón Migrante" };

export default function AdminTagsPage() {
  return <div className="grid gap-6"><PageHeader eyebrow="Contenido" title="Etiquetas" description="Las etiquetas son palabras clave que ayudan a encontrar publicaciones parecidas entre sí. Aquí puedes crear nuevas etiquetas y ver las que ya existen." /><TagsAdmin /></div>;
}

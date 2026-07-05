import { TagsAdmin } from "@/features/newsroom/newsroom-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Tags | Admin Corazón Migrante" };

export default function AdminTagsPage() {
  return <div className="grid gap-6"><PageHeader eyebrow="Contenido" title="Tags editoriales" description="Etiquetas reutilizables para clasificar publicaciones." /><TagsAdmin /></div>;
}

import { CategoriesAdmin } from "@/features/newsroom/newsroom-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Categorías | Admin Corazón Migrante" };

export default function AdminCategoriasPage() {
  return <div className="grid gap-6"><PageHeader eyebrow="Contenido" title="Categorías editoriales" description="Catálogo de categorías visible para noticias y columnas públicas." /><CategoriesAdmin /></div>;
}

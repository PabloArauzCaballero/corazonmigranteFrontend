import { CategoriesAdmin } from "@/features/newsroom/newsroom-admin";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Categorías | Admin Corazón Migrante" };

export default function AdminCategoriasPage() {
  return <div className="grid gap-6"><PageHeader eyebrow="Contenido" title="Categorías" description="Las categorías ayudan a ordenar las noticias y columnas por tema (por ejemplo: Salud, Familia, Migración). Aquí puedes crear nuevas categorías." /><CategoriesAdmin /></div>;
}

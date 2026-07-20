import { PublicContentTable } from "@/features/public-content/public-content-table";
import { AdminPublicPreview } from "@/features/public-view/admin-public-preview";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Páginas públicas | Admin Corazón Migrante" };

export default function AdminPaginasPublicasPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Páginas del sitio web"
        description="Aquí administras las páginas que ve el público (por ejemplo la biblioteca o las noticias) y decides en qué página aparece cada publicación."
      />
      <AdminPublicPreview />
      <PublicContentTable />
    </div>
  );
}

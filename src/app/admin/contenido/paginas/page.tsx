import { PublicContentTable } from "@/features/public-content/public-content-table";
import { AdminPublicPreview } from "@/features/public-view/admin-public-preview";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata = { title: "Páginas públicas | Admin Corazón Migrante" };

export default function AdminPaginasPublicasPage() {
  return (
    <div className="grid gap-6">
      <PageHeader
        title="Páginas públicas"
        description="Administra las páginas públicas dinámicas y las ubicaciones donde se incrustan publicaciones."
      />
      <AdminPublicPreview />
      <PublicContentTable />
    </div>
  );
}

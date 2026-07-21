import type { Metadata } from "next";
import { MyDownloadablesLibrary } from "@/features/downloadables/my-downloadables";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Mi contenido premium" };

export default function PatientDownloadablesPage() {
  return (
    <div className="grid gap-6">
      <PageHeader title="Mi contenido premium" description="Descarga tus guías y recursos. Cada tarjeta muestra si ya tienes acceso, si es solo premium o si requiere compra." />
      <MyDownloadablesLibrary />
    </div>
  );
}

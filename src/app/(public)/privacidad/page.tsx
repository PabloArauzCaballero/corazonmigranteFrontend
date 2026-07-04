import type { Metadata } from "next";
import { Card, CardContent } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacyPage() {
  return (
    <section className="container py-16">
      <PageHeader title="Política de privacidad" description="Documento base para revisión legal. No reemplaza asesoría jurídica." />
      <Card className="mt-8">
        <CardContent className="prose prose-stone max-w-none p-8">
          <p>Corazón Migrante debe tratar los datos personales con cuidado, finalidad clara y acceso restringido según rol.</p>
          <p>Estamos preparando el texto legal final con información clara sobre protección de datos, conservación y canales de atención.</p>
        </CardContent>
      </Card>
    </section>
  );
}

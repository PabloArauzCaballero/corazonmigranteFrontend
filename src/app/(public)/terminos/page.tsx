import type { Metadata } from "next";
import { Card, CardContent } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function TermsPage() {
  return (
    <section className="container py-16">
      <PageHeader title="Términos y condiciones" description="Base editable para revisión del negocio y asesoría legal." />
      <Card className="mt-8">
        <CardContent className="prose prose-stone max-w-none p-8">
          <p>La plataforma facilita solicitudes, gestión y seguimiento de citas. No debe interpretarse como servicio de emergencia ni diagnóstico automático.</p>
          <p><strong>PENDIENTE_CM:</strong> Confirmar condiciones finales de atención, cancelaciones, pagos, reprogramaciones y soporte.</p>
        </CardContent>
      </Card>
    </section>
  );
}

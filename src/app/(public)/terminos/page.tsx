import type { Metadata } from "next";
import { Card, CardContent } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = {
  title: "Términos y condiciones | Corazón Migrante",
  description: "Condiciones de uso de la plataforma Corazón Migrante. Conoce tus derechos y obligaciones al usar nuestros servicios.",
};

export default function TermsPage() {
  return (
    <section className="container py-16 max-w-4xl mx-auto">
      <PageHeader
        title="Términos y condiciones de uso"
        description="Última actualización: julio 2026"
      />
      <Card className="mt-8">
        <CardContent className="prose prose-stone max-w-none p-8 space-y-6">

          <h2 className="text-xl font-semibold">1. Descripción del servicio</h2>
          <p>
            Corazón Migrante es una plataforma digital que facilita la conexión entre personas
            en situación migratoria y profesionales de salud mental especializados en el
            acompañamiento terapéutico de la experiencia migratoria. La plataforma permite
            solicitar, agendar y gestionar citas de terapia psicológica, así como acceder a
            contenido editorial especializado.
          </p>
          <p>
            <strong>Importante:</strong> Corazón Migrante no constituye un servicio de
            emergencias médicas ni psiquiátricas. Si usted o alguien cercano se encuentra en
            una situación de crisis que pone en riesgo su vida, contacte inmediatamente a los
            servicios de emergencia de su país.
          </p>

          <h2 className="text-xl font-semibold">2. Registro y cuenta de usuario</h2>
          <p>
            Para acceder a los servicios de agendamiento debe crear una cuenta con información
            verídica. Es su responsabilidad mantener la confidencialidad de sus credenciales de
            acceso y notificar de inmediato al equipo de Corazón Migrante ante cualquier uso
            no autorizado de su cuenta.
          </p>
          <p>
            El registro está disponible para personas mayores de 18 años. Menores de edad
            podrán acceder únicamente con consentimiento explícito de su tutor legal, quien
            asumirá la responsabilidad del uso de la cuenta.
          </p>

          <h2 className="text-xl font-semibold">3. Reservas y cancelaciones</h2>
          <p>
            Las solicitudes de cita quedan sujetas a confirmación por parte del terapeuta
            asignado. Una vez confirmada, la cita se considera agendada y sujeta a las
            siguientes condiciones:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Cancelaciones con más de 24 horas de anticipación no generan cargo.</li>
            <li>Cancelaciones con menos de 24 horas pueden estar sujetas a penalización según la política del terapeuta.</li>
            <li>Ausencias sin aviso previo pueden ser consideradas como sesión realizada a efectos de facturación.</li>
          </ul>

          <h2 className="text-xl font-semibold">4. Pagos y facturación</h2>
          <p>
            Los honorarios de cada sesión son establecidos por el terapeuta y comunicados al
            paciente antes de la confirmación de la cita. Corazón Migrante actúa como
            intermediario administrativo y no se responsabiliza por disputas de pago entre
            paciente y terapeuta.
          </p>
          <p>
            La suscripción premium al contenido editorial se factura según las condiciones
            vigentes al momento de la contratación, disponibles en la plataforma.
          </p>

          <h2 className="text-xl font-semibold">5. Relación terapéutica</h2>
          <p>
            Los terapeutas que operan en la plataforma son profesionales independientes
            registrados bajo su propia responsabilidad profesional. Corazón Migrante no es
            responsable del contenido de las sesiones ni de los resultados terapéuticos.
            La plataforma facilita el encuentro y la coordinación administrativa, pero no
            interviene en el proceso clínico.
          </p>

          <h2 className="text-xl font-semibold">6. Propiedad intelectual</h2>
          <p>
            Todo el contenido publicado en la plataforma — artículos, guías, materiales
            editoriales — es propiedad de Corazón Migrante o de sus autores colaboradores.
            Queda prohibida su reproducción total o parcial sin autorización escrita.
          </p>

          <h2 className="text-xl font-semibold">7. Modificaciones</h2>
          <p>
            Corazón Migrante se reserva el derecho de modificar estos términos en cualquier
            momento. Los cambios serán notificados con al menos 15 días de antelación mediante
            correo electrónico a la dirección registrada. El uso continuado de la plataforma
            tras la notificación implica la aceptación de los nuevos términos.
          </p>

          <h2 className="text-xl font-semibold">8. Ley aplicable</h2>
          <p>
            Estos términos se rigen por la legislación boliviana. Cualquier controversia será
            sometida a los tribunales competentes del Estado Plurinacional de Bolivia.
          </p>

          <p className="text-sm text-stone-500 pt-4 border-t border-stone-200">
            Para consultas sobre estos términos, escríbenos a{" "}
            <a href="mailto:legal@corazonmigrante.com" className="underline">
              legal@corazonmigrante.com
            </a>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

import type { Metadata } from "next";
import { Card, CardContent } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";

export const metadata: Metadata = {
  title: "Política de privacidad | Corazón Migrante",
  description: "Cómo Corazón Migrante recopila, usa y protege tus datos personales.",
};

export default function PrivacyPage() {
  return (
    <section className="container py-16 max-w-4xl mx-auto">
      <PageHeader
        title="Política de privacidad"
        description="Última actualización: julio 2026"
      />
      <Card className="mt-8">
        <CardContent className="prose prose-stone max-w-none p-8 space-y-6">

          <p>
            En Corazón Migrante entendemos que la privacidad de los datos de salud es
            especialmente sensible. Esta política describe cómo recopilamos, usamos y
            protegemos tu información personal de acuerdo con la normativa boliviana de
            protección de datos.
          </p>

          <h2 className="text-xl font-semibold">1. Datos que recopilamos</h2>
          <p>Recopilamos los siguientes tipos de información:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Datos de identificación:</strong> nombre completo, correo electrónico, fecha de nacimiento, país y ciudad de residencia.</li>
            <li><strong>Datos de salud:</strong> notas para el terapeuta, historial de citas, motivo de consulta. Estos datos tienen tratamiento especialmente protegido.</li>
            <li><strong>Datos de uso:</strong> páginas visitadas, acciones en la plataforma (analítica anónima para mejorar el servicio).</li>
            <li><strong>Datos técnicos:</strong> dirección IP, tipo de dispositivo, navegador (necesarios para la seguridad de la sesión).</li>
          </ul>

          <h2 className="text-xl font-semibold">2. Finalidad del tratamiento</h2>
          <p>Tus datos se usan exclusivamente para:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Gestionar tu cuenta y autenticación segura.</li>
            <li>Coordinar citas entre paciente y terapeuta.</li>
            <li>Enviarte confirmaciones, recordatorios y comunicaciones transaccionales relacionadas con el servicio.</li>
            <li>Mejorar la plataforma mediante analítica agregada y anónima.</li>
            <li>Cumplir obligaciones legales aplicables.</li>
          </ul>
          <p>
            <strong>No vendemos ni compartimos tus datos con terceros</strong> con fines
            comerciales. La información de salud nunca se comparte con terceros sin tu
            consentimiento explícito, salvo requerimiento legal.
          </p>

          <h2 className="text-xl font-semibold">3. Base legal del tratamiento</h2>
          <p>
            El tratamiento de tus datos de identificación y contacto se basa en la ejecución
            del contrato de servicio que aceptas al registrarte. El tratamiento de datos de
            salud requiere tu consentimiento explícito, que otorgas al crear tu perfil y
            reservar una cita.
          </p>

          <h2 className="text-xl font-semibold">4. Acceso a tus datos</h2>
          <p>El acceso a tus datos está estrictamente controlado por rol:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Tú:</strong> acceso completo a tus propios datos desde tu dashboard.</li>
            <li><strong>Tu terapeuta:</strong> acceso únicamente a los datos necesarios para la atención (nombre, notas de sesión, historial de citas contigo).</li>
            <li><strong>Administradores:</strong> acceso operativo necesario para soporte y gestión de la plataforma, registrado en auditoría.</li>
          </ul>

          <h2 className="text-xl font-semibold">5. Conservación de datos</h2>
          <p>
            Los datos de cuenta se conservan mientras la cuenta esté activa. Puedes solicitar
            la eliminación de tu cuenta en cualquier momento; los datos se borran en un plazo
            máximo de 30 días, excepto los registros que deban conservarse por obligación
            legal (p.ej. registros contables).
          </p>
          <p>
            Los datos de salud (notas terapéuticas) se conservan durante el tiempo que exija
            la normativa sanitaria aplicable, mínimo 5 años desde la última sesión.
          </p>

          <h2 className="text-xl font-semibold">6. Seguridad</h2>
          <p>
            Implementamos medidas técnicas y organizativas para proteger tus datos: cifrado
            en tránsito (HTTPS/TLS), contraseñas almacenadas con bcrypt, tokens de sesión con
            expiración, acceso restringido por roles y registro de auditoría de todas las
            operaciones sensibles.
          </p>

          <h2 className="text-xl font-semibold">7. Tus derechos</h2>
          <p>Tienes derecho a:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Acceso:</strong> solicitar una copia de todos tus datos personales.</li>
            <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
            <li><strong>Supresión:</strong> solicitar la eliminación de tus datos cuando no sean necesarios.</li>
            <li><strong>Oposición:</strong> oponerte a ciertos tratamientos de tus datos.</li>
            <li><strong>Portabilidad:</strong> recibir tus datos en formato estructurado.</li>
          </ul>
          <p>
            Para ejercer cualquiera de estos derechos, escríbenos a{" "}
            <a href="mailto:privacidad@corazonmigrante.com" className="underline">
              privacidad@corazonmigrante.com
            </a>{" "}
            con tu nombre completo y el derecho que deseas ejercer. Responderemos en un plazo
            máximo de 30 días hábiles.
          </p>

          <h2 className="text-xl font-semibold">8. Cookies</h2>
          <p>
            La plataforma utiliza únicamente cookies estrictamente necesarias para la gestión
            de sesión y autenticación. No utilizamos cookies de rastreo publicitario ni
            compartimos datos de navegación con redes publicitarias.
          </p>

          <h2 className="text-xl font-semibold">9. Cambios a esta política</h2>
          <p>
            Notificaremos cualquier cambio significativo a esta política por correo electrónico
            con al menos 15 días de antelación. El uso continuado tras la notificación implica
            aceptación.
          </p>

          <p className="text-sm text-stone-500 pt-4 border-t border-stone-200">
            Contacto para asuntos de privacidad:{" "}
            <a href="mailto:privacidad@corazonmigrante.com" className="underline">
              privacidad@corazonmigrante.com
            </a>
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

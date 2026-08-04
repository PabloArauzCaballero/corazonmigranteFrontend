/**
 * Composición de la landing genérica, usada cuando el contenido no llega en
 * formato v2.
 *
 * Extraído de `public-landing-page.tsx`, que superaba las 700 líneas.
 */
import { resolveContactPhone } from "@/features/landing/contact";
import { DoctorPhrasesStrip, DoctorsCarousel, MigrationInvite } from "@/features/public-view/landing-sections";
import type { NormalizedPublicLanding } from "@/features/public-view/public-view.types";
import { TutorialLauncher } from "@/features/tutorial/ui/tutorial-launcher";
import { BookOpenText } from "lucide-react";
import { PublicNavbar } from "@/features/public-view/public-landing/navbar";
import { Hero } from "@/features/public-view/public-landing/hero";
import { Section } from "@/features/public-view/public-landing/sections";
import { FloatingContact, Footer } from "@/features/public-view/public-landing/footer";

export function GenericPublicLandingPage({
  landing,
}: {
  landing: NormalizedPublicLanding;
}) {
  const phone = resolveContactPhone(landing.phone);
  const sections = landing.sections.filter(
    (section) =>
      section.title ||
      section.subtitle ||
      section.body ||
      section.image?.src ||
      (section.items && section.items.length > 0),
  );

  return (
    <div className="min-h-screen bg-background text-ink">
      <PublicNavbar landing={landing} phone={phone} />
      <main>
        <Hero landing={landing} phone={phone} />
        <DoctorPhrasesStrip phone={phone} />
        {sections.length > 0 ? (
          sections.map((section) => (
            <Section section={section} landing={landing} key={section.id} />
          ))
        ) : (
          <section className="container py-16">
            <div className="rounded-[2rem] border border-line bg-card/82 p-8 shadow-[0_26px_80px_rgba(43,27,23,0.10)]">
              <div className="flex items-start gap-3">
                <BookOpenText
                  className="mt-1 h-5 w-5 text-primary"
                  aria-hidden="true"
                />
                <div>
                  <h2 className="text-2xl font-black text-ink">
                    Contenido en preparación
                  </h2>
                  <p className="mt-2 leading-7 text-ink-muted">
                    Estamos preparando nuevas secciones para explicar mejor los
                    servicios de Corazón Migrante.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
        <DoctorsCarousel />
        <MigrationInvite />
      </main>
      <Footer landing={landing} phone={phone} />
      <FloatingContact phone={phone} />
      <TutorialLauncher />
    </div>
  );
}

"use client";

/**
 * Página de aterrizaje pública (formato v2).
 *
 * Solo compone: cada bloque vive en `./landing-v2/`. El archivo superaba las
 * 1000 líneas y mezclaba utilidades de texto, barra de navegación, hero, cinco
 * secciones y pie en un único sitio.
 */
import { ScrollProgress } from "@/features/landing/scroll-progress";
import { DoctorPhrasesStrip, DoctorsCarousel, MigrationInvite } from "@/features/public-view/landing-sections";
import type { LandingV2Content } from "@/features/public-view/landing-v2.types";
import type { NormalizedPublicLanding } from "@/features/public-view/public-view.types";
import { TutorialLauncher } from "@/features/tutorial/ui/tutorial-launcher";
import { Navbar } from "@/features/public-view/landing-v2/navbar";
import { Hero, PresentationSection } from "@/features/public-view/landing-v2/hero";
import { HistorySection, MissionSection } from "@/features/public-view/landing-v2/history-mission";
import { ContactSection, EmotionsSection } from "@/features/public-view/landing-v2/emotions-contact";
import { FloatingContact, Footer } from "@/features/public-view/landing-v2/footer";

export function LandingV2Page({
  content,
  landing,
  phone,
}: {
  content: LandingV2Content;
  landing: NormalizedPublicLanding;
  phone?: string;
}) {
  return (
    <div className="landing-root min-h-screen bg-background text-ink">
      <ScrollProgress />
      <Navbar content={content} landing={landing} phone={phone} />
      <main>
        <Hero content={content} phone={phone} />
        <DoctorPhrasesStrip phone={phone} />
        <PresentationSection content={content} landing={landing} phone={phone} />
        <HistorySection content={content} landing={landing} />
        <MissionSection content={content} landing={landing} />
        <EmotionsSection content={content} landing={landing} />
        <DoctorsCarousel />
        <MigrationInvite />
        <ContactSection content={content} phone={phone} />
      </main>
      <Footer content={content} phone={phone} />
      <FloatingContact phone={phone} />
      <TutorialLauncher />
    </div>
  );
}

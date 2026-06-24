import React, { useCallback, useState } from "react";
import "../styles/landing.css";

import LandingNavbar from "../components/landing/LandingNavbar";
import ThemeToggleFab from "../components/landing/ThemeToggleFab";
import WhatsAppFab from "../components/landing/WhatsAppFab";
import LandingFooter from "../components/landing/LandingFooter";
import ScrollProgress from "../components/landing/ScrollProgress";
import PublicLoginPage from "../auth/PublicLoginPage";
import PublicSignupPage from "../auth/PublicSignupPage";

import HeroSection from "../components/landing/sections/HeroSection";
import ImpactPanelSection from "../components/landing/sections/ImpactPanelSection";
import MapSection from "../components/landing/sections/MapSection";
import MissionSection from "../components/landing/sections/MissionSection";
import EmotionsSection from "../components/landing/sections/EmotionsSection";
import PsychologistsSection from "../components/landing/sections/PsychologistsSection";
import CTASection from "../components/landing/sections/CTASection";

import { useLandingContent } from "../hooks/useLandingContent";

function smoothScrollToHash(href) {
  if (!href || typeof href !== "string") return false;
  if (!href.startsWith("#")) return false;
  const el = document.querySelector(href);
  if (!el) return false;
  el.scrollIntoView({ behavior: "smooth" });
  return true;
}

export default function LandingHome() {
  const [view, setView] = useState("landing"); // landing | login | signup

  const { content, uiById, resolveUiUrl, loading, error } = useLandingContent();

  const runAction = useCallback((action, href) => {
    switch (action) {
      case "public_login":
      case "login":
        setView("login");
        return;

      case "public_signup":
      case "signup":
      case "register":
        setView("signup");
        return;

      case "portal_admin":

        return;

      case "open_booking_or_availability":
        smoothScrollToHash("#contacto");
        return;

      default:
        // fallback: scroll si href es hash
        if (smoothScrollToHash(href)) return;
        return;
    }
  }, []);


  if (view === "login") {
    return <PublicLoginPage onBack={() => setView("landing")} />;
  }

  if (view === "signup") {
    return (
      <PublicSignupPage
        onBack={() => setView("landing")}
        onGoLogin={() => setView("login")}
      />
    );
  }

  if (loading && !content) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="h-16" />
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="h-10 w-56 rounded bg-black/5 dark:bg-white/10" />
          <div className="mt-6 h-24 w-full rounded bg-black/5 dark:bg-white/10" />
          <div className="mt-4 h-24 w-full rounded bg-black/5 dark:bg-white/10" />
        </div>
      </div>
    );
  }

  if (error && !content) {
    console.error("LANDING JSON fetch error:", error);
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="max-w-7xl mx-auto px-6 py-10 text-sm opacity-70">
          Error al cargar landing_page.json (revisa Network/CORS/403/404).
        </div>
      </div>
    );
  }
  if (error && !content) {
    console.error("LANDING JSON fetch error:", error);
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="max-w-7xl mx-auto px-6 py-10 text-sm opacity-70">
          Error al cargar landing_page.json (revisa Network/CORS/403/404).
        </div>
      </div>
    );
  }

  const navbar = content?.navbar;
  const hero = content?.hero;
  const sections = content?.sections || {};

  // Nuevo contrato: presentation_section viene desde DB/JSON público
  const presentationSection = content?.presentation_section || null;

  // Fallback mínimo (solo si el backend aún no envía presentation_section)
  const presentationFallback = {
    badge: { icon: "favorite", text: "Acompañamiento emocional para migrantes" },
    title: "Migrar no es solo cambiar de país",
    subtitle: "Es cargar una historia entera en el pecho. Aquí puedes sostenerte, paso a paso.",
    description: [
      "Ansiedad, culpa migratoria y nostalgia",
      "Atención online, confidencial y humana",
      "Profesionales con enfoque clínico",
    ],
    primary_cta: { label: "Agendar una cita", action: "scroll_to_contacto", href: "#contacto" },
    secondary_cta: { label: "Conocer emociones", action: "scroll_to_emociones", href: "#emociones" },
    img: { id_ui: null, alt: "Personas caminando", fallback_src: "" },
    img_footer_text: "“Cuando migras, no te vas solo: te llevas tu gente, tu idioma y tu historia.”",
  };

  const footer = content?.footer;
  const ui = content?.ui;
  const telefono = content?.telefono;

  const dev = import.meta.env.DEV;

  if (dev) {
    // console logs removed
  }

  const hasSchema =
    !!content?.navbar && !!content?.hero && !!content?.sections && !!content?.footer;

  if (!loading && !error && !hasSchema) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark p-6">
        <div className="text-sm opacity-70">
          JSON llegó pero NO coincide con schema esperado (navbar/hero/sections/footer).
        </div>
        <pre className="mt-4 text-xs opacity-70 whitespace-pre-wrap">
          {JSON.stringify(
            {
              keys: content ? Object.keys(content) : null,
              sample: content,
            },
            null,
            2
          )}
        </pre>
      </div>
    );
  }

  return (
    <div id="inicio" className="bg-background-light dark:bg-background-dark transition-colors duration-300 antialiased">
      <ScrollProgress />
      <LandingNavbar data={navbar} uiById={uiById} onAction={runAction} />

      <ImpactPanelSection
        data={presentationSection || presentationFallback}
        onAction={runAction}
        resolveUiUrl={resolveUiUrl}
      />

      <HeroSection data={hero} onAction={runAction} />

      <MapSection data={sections.map} uiById={uiById} onAction={runAction} />
      <MissionSection data={sections.mission} uiById={uiById} onAction={runAction} />
      <EmotionsSection data={sections.emotions} uiById={uiById} />
      <PsychologistsSection data={sections.psicologists} />
      <CTASection data={sections.cta} onAction={runAction} telefono={telefono} />

      <LandingFooter data={footer} />
      <WhatsAppFab phone={telefono} message="Quiero agendar una cita" labels={ui?.whatsapp_fab} />
      <ThemeToggleFab labels={ui?.theme_toggle} />
    </div>
  );
}
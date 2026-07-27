"use client";

import { HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { GuidedTour, type TourStep } from "@/features/tutorial/guided-tour";

/** Tour por defecto de la experiencia pública (landing + accesos). */
export const LANDING_TOUR: TourStep[] = [
  {
    placement: "center",
    title: "Bienvenido a Corazón Migrante",
    body: "Te mostramos en menos de un minuto cómo moverte por la plataforma. Puedes salir cuando quieras.",
  },
  {
    target: 'a[aria-label="Ir al inicio"]',
    placement: "bottom",
    title: "Tu punto de partida",
    body: "Desde el logo siempre vuelves al inicio. Arriba tienes el menú principal.",
  },
  {
    target: 'a[href^="/biblioteca"]',
    placement: "bottom",
    title: "Biblioteca emocional",
    body: "Aquí encuentras guías, historias reales y cursos para acompañar tu proceso, a tu ritmo.",
  },
  {
    target: '[data-tour="empezar"]',
    placement: "bottom",
    title: "Da el primer paso",
    body: "Con este botón empiezas tu proceso: creas tu cuenta y puedes solicitar una cita.",
  },
  {
    target: 'a[href^="/login"]',
    placement: "bottom",
    title: "Tu portal privado",
    body: "Si ya tienes cuenta, entra aquí para ver tus citas, tu contenido y tu perfil.",
  },
  {
    target: '[data-tour="contacto"]',
    placement: "left",
    title: "Habla con alguien",
    body: "¿Prefieres escribir? Este botón te conecta por WhatsApp. No hace falta tener las palabras perfectas.",
  },
  {
    placement: "center",
    title: "¡Listo!",
    body: "Eso es todo por ahora. Puedes reabrir este tutorial cuando quieras con el botón «¿Cómo funciona?».",
  },
];

/** Tour del portal administrativo (recorre las secciones del menú lateral). */
export const ADMIN_TOUR: TourStep[] = [
  {
    placement: "center",
    title: "Bienvenido al panel administrativo",
    body: "Un recorrido rápido por las secciones clave para gestionar la plataforma. Puedes salir cuando quieras.",
  },
  {
    target: 'a[href^="/admin/notificaciones"]',
    placement: "right",
    title: "Notificaciones",
    body: "Eventos importantes del sistema: nuevas citas, cambios de estado y registros de usuarios.",
  },
  {
    target: 'a[href^="/admin/solicitudes"]',
    placement: "right",
    title: "Citas de pacientes",
    body: "Revisa y gestiona las solicitudes de cita que envían los pacientes.",
  },
  {
    target: 'a[href^="/admin/usuarios"]',
    placement: "right",
    title: "Personas registradas",
    body: "Administra las cuentas de pacientes, terapeutas y personal.",
  },
  {
    target: 'a[href^="/admin/descargables"]',
    placement: "right",
    title: "Descargables",
    body: "Guías, PDFs y recursos con control de visibilidad, métricas de descargas e historial de versiones.",
  },
  {
    target: '[data-tour="nav-group-publicidad"]',
    placement: "right",
    title: "Publicidad",
    body: "Empresas anunciantes, ubicaciones de anuncios, campañas y creativos.",
  },
  {
    target: 'a[href^="/admin/contenido/publicaciones"]',
    placement: "right",
    title: "Publicaciones",
    body: "Crea, edita y publica el contenido editorial (noticias, columnas y artículos).",
  },
  {
    target: 'a[href^="/admin/contenido/suscriptores"]',
    placement: "right",
    title: "Suscriptores premium",
    body: "Aprueba o rechaza las solicitudes de acceso premium que envían los usuarios.",
  },
  {
    placement: "center",
    title: "¡Listo!",
    body: "Ya conoces el panel. Reabre este tutorial cuando quieras con el botón «¿Cómo funciona?».",
  },
];

/** Tour del portal del paciente. */
export const PATIENT_TOUR: TourStep[] = [
  {
    placement: "center",
    title: "Bienvenido a tu portal",
    body: "Aquí gestionas tus citas y accedes a tu contenido. Te mostramos lo esencial en un minuto.",
  },
  {
    target: 'a[href^="/paciente/citas"]',
    placement: "right",
    title: "Mis citas",
    body: "Consulta el estado de tus citas: próximas, confirmadas y su historial.",
  },
  {
    target: 'a[href^="/paciente/booking"]',
    placement: "right",
    title: "Reservar cita",
    body: "Solicita una nueva cita eligiendo disponibilidad de forma clara y sin presión.",
  },
  {
    target: 'a[href^="/paciente/premium"]',
    placement: "right",
    title: "Contenido premium",
    body: "Accede a recursos exclusivos y solicita tu suscripción premium si aún no la tienes.",
  },
  {
    target: 'a[href^="/paciente/descargables"]',
    placement: "right",
    title: "Mis descargables",
    body: "Guías y materiales que puedes consultar y descargar cuando los necesites.",
  },
  {
    target: 'a[href^="/paciente/perfil"]',
    placement: "right",
    title: "Tu perfil",
    body: "Actualiza tus datos y preferencias. Tu información se trata con cuidado.",
  },
  {
    placement: "center",
    title: "¡Listo!",
    body: "Eso es todo. Reabre este tutorial cuando quieras con el botón «¿Cómo funciona?».",
  },
];

export function TutorialLauncher({
  steps = LANDING_TOUR,
  storageKey = "cm.tour.landing.v1",
  autoStart = true,
  position = "left",
}: {
  steps?: TourStep[];
  storageKey?: string;
  autoStart?: boolean;
  /** Esquina donde se ancla el botón (en los portales va a la derecha para no chocar con el sidebar). */
  position?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);

  // Auto-inicio en la primera visita.
  useEffect(() => {
    if (!autoStart) return;
    let seen = false;
    try {
      seen = window.localStorage.getItem(storageKey) === "1";
    } catch {
      seen = false;
    }
    if (seen) return;
    const t = window.setTimeout(() => setOpen(true), 1400);
    return () => window.clearTimeout(t);
  }, [autoStart, storageKey]);

  const handleClose = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      /* almacenamiento no disponible */
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir tutorial: cómo funciona la plataforma"
        className={`fixed bottom-5 z-40 inline-flex h-12 items-center gap-2 rounded-full border border-primary/20 bg-white/90 px-4 text-sm font-bold text-primary shadow-[0_14px_36px_rgba(43,27,23,0.18)] backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white ${position === "right" ? "right-5" : "left-5"}`}
      >
        <HelpCircle className="h-5 w-5" aria-hidden="true" />
        <span className="hidden sm:inline">¿Cómo funciona?</span>
      </button>

      <GuidedTour steps={steps} open={open} onClose={handleClose} />
    </>
  );
}

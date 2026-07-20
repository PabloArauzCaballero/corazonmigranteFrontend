/**
 * Recursos locales de la landing (imágenes en /public/landing).
 * Fuente de verdad visual: garantiza que la portada siempre muestre
 * imágenes reales aunque el backend no las provea.
 */

export const CAROUSEL_IMAGES: string[] = [
  "/landing/carrusel-1.webp",
  "/landing/carrusel-2.webp",
  "/landing/carrusel-3.webp",
  "/landing/carrusel-4.webp",
  "/landing/carrusel-5.webp",
  "/landing/carrusel-6.webp",
  "/landing/carrusel-7.webp",
];

export type Specialist = {
  name: string;
  role: string;
  image: string;
  /** Frase corta e impactante extraída de su historia. */
  phrase: string;
  tags: string[];
};

export const SPECIALISTS: Specialist[] = [
  {
    name: "Marlene Cossio",
    role: "Psicóloga Clínica",
    image: "/landing/doctor-marlene.webp",
    phrase: "Migrar no afecta solo a quien se va: también transforma profundamente a quien se queda.",
    tags: ["Migración", "Maternidad", "Acompañamiento"],
  },
  {
    name: "Guillermo Rivera",
    role: "Médico Psiquiatra",
    image: "/landing/doctor-guillermo.webp",
    phrase: "El dolor de migrar no siempre aparece en un diagnóstico: vive en los silencios.",
    tags: ["Psiquiatría", "Salud mental", "Escucha clínica"],
  },
  {
    name: "Daniel Limpias",
    role: "Psicólogo",
    image: "/landing/doctor-daniel.webp",
    phrase: "Se puede estar bien en otro lugar y, aun así, sentir que algo no encaja del todo.",
    tags: ["Desarraigo", "Identidad", "Migración"],
  },
  {
    name: "Diane Wimberly",
    role: "Psicóloga",
    image: "/landing/doctor-diane.webp",
    phrase: "La barrera del idioma no es solo lingüística: es emocional.",
    tags: ["Biculturalidad", "Adaptación", "Empatía"],
  },
];

/** Imagen impactante para la invitación a la biblioteca. */
export const MIGRATION_INVITE_IMAGE = "/landing/carrusel-5.webp";
export const STORY_IMAGE = "/landing/story.webp";
export const MISSION_IMAGE = "/landing/mission.webp";
export const LANDING_LOGO = "/landing/logo.png";

/**
 * Descargables con integración a Hotmart.
 * Reemplaza cada `hotmartUrl` por el enlace real de tu producto en Hotmart.
 */
export type Downloadable = {
  title: string;
  description: string;
  badge: string;
  hotmartUrl: string;
  cover: string;
};

export const DOWNLOADABLES: Downloadable[] = [
  {
    title: "Guía: Culpa migratoria",
    description: "Un cuadernillo práctico para reconocer y soltar la culpa de haberte ido y de estar mejor.",
    badge: "PDF descargable",
    hotmartUrl: "https://hotmart.com/es",
    cover: "/landing/emocion-culpa.webp",
  },
  {
    title: "Ansiedad y modo alerta",
    description: "Herramientas para calmar la sensación de que algo malo puede pasar, aunque todo esté bien.",
    badge: "Recurso premium",
    hotmartUrl: "https://hotmart.com/es",
    cover: "/landing/emocion-ansiedad.webp",
  },
  {
    title: "Descanso sin culpa",
    description: "Ejercicios para recuperar energía cuando la sobrecarga emocional te agota por dentro.",
    badge: "Audio + PDF",
    hotmartUrl: "https://hotmart.com/es",
    cover: "/landing/emocion-cansancio.webp",
  },
];

/**
 * Recursos de la landing.
 *
 * Las imágenes viven en Cloudinary (subidas desde el backend con
 * `node scripts/upload-landing-assets.mjs`) bajo la carpeta
 * `<CLOUDINARY_FOLDER>/landing_page/media/`. La URL se construye a partir de
 * NEXT_PUBLIC_FILE_SERVER_PUBLIC_ASSETS_BASE_URL.
 *
 * Cada imagen tiene además una copia local en /public/landing que se usa como
 * respaldo automático (onError) para que la portada nunca se vea caída.
 */
import { fileServer } from "@/config/file-server";

const CLOUD_MEDIA_BASE = `${fileServer.publicAssetsBaseUrl}/landing_page/media`;

/** URL de Cloudinary para una imagen de la landing. */
export function cloudImg(name: string): string {
  return `${CLOUD_MEDIA_BASE}/${name}`;
}

/** Ruta local de respaldo (bundle en /public/landing). */
export function localImg(name: string): string {
  return `/landing/${name}`;
}

// Nombres de archivo (se resuelven a Cloudinary con respaldo local).
export const CAROUSEL_IMAGES: string[] = [
  "carrusel-1.webp",
  "carrusel-2.webp",
  "carrusel-3.webp",
  "carrusel-4.webp",
  "carrusel-5.webp",
  "carrusel-6.webp",
  "carrusel-7.webp",
];

export type Specialist = {
  name: string;
  role: string;
  image: string; // nombre de archivo
  phrase: string;
  tags: string[];
};

export const SPECIALISTS: Specialist[] = [
  {
    name: "Marlene Cossio",
    role: "Psicóloga Clínica",
    image: "doctor-marlene.webp",
    phrase: "Migrar no afecta solo a quien se va: también transforma profundamente a quien se queda.",
    tags: ["Migración", "Maternidad", "Acompañamiento"],
  },
  {
    name: "Guillermo Rivera",
    role: "Médico Psiquiatra",
    image: "doctor-guillermo.webp",
    phrase: "El dolor de migrar no siempre aparece en un diagnóstico: vive en los silencios.",
    tags: ["Psiquiatría", "Salud mental", "Escucha clínica"],
  },
  {
    name: "Daniel Limpias",
    role: "Psicólogo",
    image: "doctor-daniel.webp",
    phrase: "Se puede estar bien en otro lugar y, aun así, sentir que algo no encaja del todo.",
    tags: ["Desarraigo", "Identidad", "Migración"],
  },
  {
    name: "Diane Wimberly",
    role: "Psicóloga",
    image: "doctor-diane.webp",
    phrase: "La barrera del idioma no es solo lingüística: es emocional.",
    tags: ["Biculturalidad", "Adaptación", "Empatía"],
  },
];

/** Imagen impactante para la invitación a la biblioteca. */
export const MIGRATION_INVITE_IMAGE = "carrusel-5.webp";

/**
 * Descargables con integración a Hotmart.
 * Reemplaza cada `hotmartUrl` por el enlace real de tu producto en Hotmart.
 */
export type Downloadable = {
  title: string;
  description: string;
  badge: string;
  hotmartUrl: string;
  cover: string; // nombre de archivo
};

export const DOWNLOADABLES: Downloadable[] = [
  {
    title: "Guía: Culpa migratoria",
    description: "Un cuadernillo práctico para reconocer y soltar la culpa de haberte ido y de estar mejor.",
    badge: "PDF descargable",
    hotmartUrl: "https://hotmart.com/es",
    cover: "emocion-culpa.webp",
  },
  {
    title: "Ansiedad y modo alerta",
    description: "Herramientas para calmar la sensación de que algo malo puede pasar, aunque todo esté bien.",
    badge: "Recurso premium",
    hotmartUrl: "https://hotmart.com/es",
    cover: "emocion-ansiedad.webp",
  },
  {
    title: "Descanso sin culpa",
    description: "Ejercicios para recuperar energía cuando la sobrecarga emocional te agota por dentro.",
    badge: "Audio + PDF",
    hotmartUrl: "https://hotmart.com/es",
    cover: "emocion-cansancio.webp",
  },
];

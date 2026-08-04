import { z } from "zod";

const optionalUrl = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().url().optional(),
);
/** Bandera booleana en texto: "true"/"1" activan, cualquier otra cosa desactiva. */
const booleanFlag = z.preprocess(
  (value) => (typeof value === "string" ? ["true", "1", "on"].includes(value.trim().toLowerCase()) : value),
  z.boolean().default(false),
);
const publicPageSlugWithDefault = (fallback: string) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return value;
    const slug = value.trim();
    if (!slug) return undefined;
    if (slug === "1") return "inicio";
    if (slug === "2") return "biblioteca";
    return slug;
  }, z.string().min(1).default(fallback));
const envSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Corazón Migrante"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:4173"),
  NEXT_PUBLIC_API_BASE_URL: optionalUrl,
  NEXT_PUBLIC_PUBLIC_VIEW_SLUG: publicPageSlugWithDefault("inicio"),
  NEXT_PUBLIC_CMS_LIBRARY_SLUG: publicPageSlugWithDefault("biblioteca"),
  NEXT_PUBLIC_PUBLIC_VIEW_CODE: z.string().optional(),
  NEXT_PUBLIC_PUBLIC_VIEW_ENDPOINT: z.string().optional(),
  NEXT_PUBLIC_PUBLIC_VIEW_ELEMENT_ENDPOINT: z.string().optional(),
  NEXT_PUBLIC_PUBLIC_CONTACT_PHONE: z.string().optional(),
  NEXT_PUBLIC_FILE_SERVER_LOGO_URL: optionalUrl,
  NEXT_PUBLIC_FILE_SERVER_AUTH_IMAGE_URL: optionalUrl,
  NEXT_PUBLIC_FILE_SERVER_LANDING_HERO_IMAGE_URL: optionalUrl,
  NEXT_PUBLIC_FILE_SERVER_THERAPY_IMAGE_URL: optionalUrl,
  NEXT_PUBLIC_FILE_SERVER_FAMILY_IMAGE_URL: optionalUrl,
  NEXT_PUBLIC_FILE_SERVER_LIBRARY_IMAGE_URL: optionalUrl,
  NEXT_PUBLIC_FILE_SERVER_EDITORIAL_HERO_IMAGE_URL: optionalUrl,
  NEXT_PUBLIC_FILE_SERVER_EDITORIAL_FALLBACK_IMAGE_URL: optionalUrl,
  NEXT_PUBLIC_FILE_SERVER_PUBLIC_ASSETS_BASE_URL: optionalUrl,
  NEXT_PUBLIC_FILE_SERVER_SPECIALTIES_URL: optionalUrl,
  NEXT_PUBLIC_FILE_SERVER_PROFESSIONS_URL: optionalUrl,
  NEXT_PUBLIC_FILE_SERVER_COUNTRIES_CITIES_URL: optionalUrl,
  NEXT_PUBLIC_FILE_SERVER_OCCUPATIONS_URL: optionalUrl,
  NEXT_PUBLIC_FILE_SERVER_SYMPTOMS_URL: optionalUrl,
  NEXT_PUBLIC_FILE_SERVER_THERAPY_GOALS_URL: optionalUrl,
  // Fotos de especialistas de la landing (Cloudinary). Si quedan vacías se usa el
  // fallback de file-server.ts.
  NEXT_PUBLIC_FILE_SERVER_DOCTOR_GUILLERMO_URL: optionalUrl,
  NEXT_PUBLIC_FILE_SERVER_DOCTOR_DANIEL_URL: optionalUrl,
  /**
   * Activa la sincronización del progreso de tutoriales con el backend. Se deja en
   * `false` hasta que exista `/api/v1/me/tutorials/progress`; con la bandera apagada el
   * progreso se guarda solo en el navegador.
   */
  NEXT_PUBLIC_TUTORIALS_REMOTE_PROGRESS: booleanFlag,
});

/**
 * Hosts que solo pueden ser correctos en una máquina de desarrollo.
 *
 * `NEXT_PUBLIC_APP_URL` alimenta `metadataBase`, las URLs canónicas, Open Graph,
 * `robots.txt`, `sitemap.xml` y el manifest instalable. Si un build de producción
 * sale con `http://localhost:5173`, el sitio publica canónicas hacia localhost:
 * los buscadores descartan las páginas y las tarjetas sociales quedan rotas. Y no
 * se nota mirando el sitio — solo semanas después, en el posicionamiento.
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);

export function isLocalAppUrl(appUrl: string): boolean {
  try {
    return LOCAL_HOSTS.has(new URL(appUrl).hostname);
  } catch {
    return false;
  }
}

/**
 * Corta el build cuando se compila para desplegar con una URL local.
 *
 * Se exige el fallo solo en CI (`process.env.CI`), que es donde se producen los
 * artefactos que llegan a producción. En local se avisa pero NO se rompe: hacer
 * `yarn build` para comprobar algo con el `.env` de desarrollo es legítimo y
 * frecuente.
 */
let warnedAboutAppUrl = false;

export function assertDeployableAppUrl(
  appUrl: string,
  { ci = Boolean(process.env.CI), warn = console.warn }: { ci?: boolean; warn?: (msg: string) => void } = {},
): void {
  if (!isLocalAppUrl(appUrl)) return;

  const message =
    `NEXT_PUBLIC_APP_URL apunta a un host local ("${appUrl}"). Ese valor se publica en ` +
    "metadataBase, las URLs canónicas, Open Graph, robots.txt, sitemap.xml y el manifest. " +
    "Define el dominio real en el entorno de build.";

  if (ci) throw new Error(`[config] ${message}`);

  // Next carga la configuración varias veces por build (compilador, recolección de
  // páginas, exportación). Sin esta guarda el mismo aviso se repite cinco veces y
  // deja de leerse.
  if (warnedAboutAppUrl) return;
  warnedAboutAppUrl = true;
  warn(`[config] Aviso: ${message} (no se bloquea el build fuera de CI)`);
}

/** Solo para pruebas: reinicia la deduplicación del aviso. */
export function resetAppUrlWarning(): void {
  warnedAboutAppUrl = false;
}

export const env = envSchema.parse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_PUBLIC_VIEW_SLUG: process.env.NEXT_PUBLIC_PUBLIC_VIEW_SLUG,
  NEXT_PUBLIC_CMS_LIBRARY_SLUG: process.env.NEXT_PUBLIC_CMS_LIBRARY_SLUG,
  NEXT_PUBLIC_PUBLIC_VIEW_CODE: process.env.NEXT_PUBLIC_PUBLIC_VIEW_CODE,
  NEXT_PUBLIC_PUBLIC_VIEW_ENDPOINT:
    process.env.NEXT_PUBLIC_PUBLIC_VIEW_ENDPOINT,
  NEXT_PUBLIC_PUBLIC_VIEW_ELEMENT_ENDPOINT:
    process.env.NEXT_PUBLIC_PUBLIC_VIEW_ELEMENT_ENDPOINT,
  NEXT_PUBLIC_PUBLIC_CONTACT_PHONE:
    process.env.NEXT_PUBLIC_PUBLIC_CONTACT_PHONE,
  NEXT_PUBLIC_FILE_SERVER_LOGO_URL:
    process.env.NEXT_PUBLIC_FILE_SERVER_LOGO_URL,
  NEXT_PUBLIC_FILE_SERVER_AUTH_IMAGE_URL:
    process.env.NEXT_PUBLIC_FILE_SERVER_AUTH_IMAGE_URL,
  NEXT_PUBLIC_FILE_SERVER_LANDING_HERO_IMAGE_URL:
    process.env.NEXT_PUBLIC_FILE_SERVER_LANDING_HERO_IMAGE_URL,
  NEXT_PUBLIC_FILE_SERVER_THERAPY_IMAGE_URL:
    process.env.NEXT_PUBLIC_FILE_SERVER_THERAPY_IMAGE_URL,
  NEXT_PUBLIC_FILE_SERVER_FAMILY_IMAGE_URL:
    process.env.NEXT_PUBLIC_FILE_SERVER_FAMILY_IMAGE_URL,
  NEXT_PUBLIC_FILE_SERVER_LIBRARY_IMAGE_URL:
    process.env.NEXT_PUBLIC_FILE_SERVER_LIBRARY_IMAGE_URL,
  NEXT_PUBLIC_FILE_SERVER_EDITORIAL_HERO_IMAGE_URL:
    process.env.NEXT_PUBLIC_FILE_SERVER_EDITORIAL_HERO_IMAGE_URL,
  NEXT_PUBLIC_FILE_SERVER_EDITORIAL_FALLBACK_IMAGE_URL:
    process.env.NEXT_PUBLIC_FILE_SERVER_EDITORIAL_FALLBACK_IMAGE_URL,
  NEXT_PUBLIC_FILE_SERVER_PUBLIC_ASSETS_BASE_URL:
    process.env.NEXT_PUBLIC_FILE_SERVER_PUBLIC_ASSETS_BASE_URL,
  NEXT_PUBLIC_FILE_SERVER_SPECIALTIES_URL:
    process.env.NEXT_PUBLIC_FILE_SERVER_SPECIALTIES_URL,
  NEXT_PUBLIC_FILE_SERVER_PROFESSIONS_URL:
    process.env.NEXT_PUBLIC_FILE_SERVER_PROFESSIONS_URL,
  NEXT_PUBLIC_FILE_SERVER_COUNTRIES_CITIES_URL:
    process.env.NEXT_PUBLIC_FILE_SERVER_COUNTRIES_CITIES_URL,
  NEXT_PUBLIC_FILE_SERVER_OCCUPATIONS_URL:
    process.env.NEXT_PUBLIC_FILE_SERVER_OCCUPATIONS_URL,
  NEXT_PUBLIC_FILE_SERVER_SYMPTOMS_URL:
    process.env.NEXT_PUBLIC_FILE_SERVER_SYMPTOMS_URL,
  NEXT_PUBLIC_FILE_SERVER_THERAPY_GOALS_URL:
    process.env.NEXT_PUBLIC_FILE_SERVER_THERAPY_GOALS_URL,
  NEXT_PUBLIC_FILE_SERVER_DOCTOR_GUILLERMO_URL:
    process.env.NEXT_PUBLIC_FILE_SERVER_DOCTOR_GUILLERMO_URL,
  NEXT_PUBLIC_FILE_SERVER_DOCTOR_DANIEL_URL:
    process.env.NEXT_PUBLIC_FILE_SERVER_DOCTOR_DANIEL_URL,
  NEXT_PUBLIC_TUTORIALS_REMOTE_PROGRESS:
    process.env.NEXT_PUBLIC_TUTORIALS_REMOTE_PROGRESS,
});

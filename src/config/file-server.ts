import { env } from "@/config/env";

const DEFAULT_FILE_SERVER = {
  logoUrl: "https://storage.googleapis.com/vistas_publicas_assets/global_assets/media/LOGO%20CORAZON%20MIGRANTE.png",
  authImageUrl: "https://storage.googleapis.com/vistas_publicas_assets/landing_page/media/Dise_o_sin_t_tulo_7__c464ecd0-68bd-4a35-afed-c7bad56c7670.png",
  landingHeroImageUrl: "https://storage.googleapis.com/vistas_publicas_assets/landing_page/media/Ana_migrante-1.jpg",
  therapyImageUrl: "https://storage.googleapis.com/vistas_publicas_assets/landing_page/media/Dise_o_sin_t_tulo_7__c464ecd0-68bd-4a35-afed-c7bad56c7670.png",
  familyImageUrl: "https://storage.googleapis.com/vistas_publicas_assets/landing_page/media/Ana_migrante-1.jpg",
  libraryImageUrl: "https://storage.googleapis.com/vistas_publicas_assets/landing_page/media/Dise_o_sin_t_tulo_7__c464ecd0-68bd-4a35-afed-c7bad56c7670.png",
  editorialHeroImageUrl: "https://storage.googleapis.com/vistas_publicas_assets/landing_page/media/Dise_o_sin_t_tulo_7__c464ecd0-68bd-4a35-afed-c7bad56c7670.png",
  editorialFallbackImageUrl: "https://storage.googleapis.com/vistas_publicas_assets/landing_page/media/Dise_o_sin_t_tulo_7__c464ecd0-68bd-4a35-afed-c7bad56c7670.png",
  specialtiesUrl: "https://storage.googleapis.com/vistas_publicas_assets/admin_portal/options/ESPECIALIDADES_SALUD_MENTAL.json",
  professionsUrl: "https://storage.googleapis.com/vistas_publicas_assets/admin_portal/options/PROFESIONES_SALUD_MENTAL.json",
  countriesCitiesUrl: "https://storage.googleapis.com/vistas_publicas_assets/admin_portal/options/PAISES_CIUDADES.json",
  occupationsUrl: "https://storage.googleapis.com/vistas_publicas_assets/landing_page/text_content/OCUPACIONES.json",
  symptomsUrl: "https://storage.googleapis.com/vistas_publicas_assets/landing_page/text_content/SINTOMAS_PSICOLOGICOS_PSIQUIATRICOS.json",
  therapyGoalsUrl: "https://storage.googleapis.com/vistas_publicas_assets/landing_page/text_content/OBJETIVOS_TERAPIA.json",
  publicAssetsBaseUrl: "https://storage.googleapis.com/vistas_publicas_assets"
} as const;

function removeTrailingSlash(value?: string) {
  return value?.replace(/\/$/, "");
}

export const fileServer = {
  logoUrl: env.NEXT_PUBLIC_FILE_SERVER_LOGO_URL ?? DEFAULT_FILE_SERVER.logoUrl,
  authImageUrl: env.NEXT_PUBLIC_FILE_SERVER_AUTH_IMAGE_URL ?? DEFAULT_FILE_SERVER.authImageUrl,
  landingHeroImageUrl: env.NEXT_PUBLIC_FILE_SERVER_LANDING_HERO_IMAGE_URL ?? DEFAULT_FILE_SERVER.landingHeroImageUrl,
  therapyImageUrl: env.NEXT_PUBLIC_FILE_SERVER_THERAPY_IMAGE_URL ?? DEFAULT_FILE_SERVER.therapyImageUrl,
  familyImageUrl: env.NEXT_PUBLIC_FILE_SERVER_FAMILY_IMAGE_URL ?? DEFAULT_FILE_SERVER.familyImageUrl,
  libraryImageUrl: env.NEXT_PUBLIC_FILE_SERVER_LIBRARY_IMAGE_URL ?? DEFAULT_FILE_SERVER.libraryImageUrl,
  editorialHeroImageUrl: env.NEXT_PUBLIC_FILE_SERVER_EDITORIAL_HERO_IMAGE_URL ?? DEFAULT_FILE_SERVER.editorialHeroImageUrl,
  editorialFallbackImageUrl: env.NEXT_PUBLIC_FILE_SERVER_EDITORIAL_FALLBACK_IMAGE_URL ?? DEFAULT_FILE_SERVER.editorialFallbackImageUrl,
  publicAssetsBaseUrl: removeTrailingSlash(env.NEXT_PUBLIC_FILE_SERVER_PUBLIC_ASSETS_BASE_URL ?? DEFAULT_FILE_SERVER.publicAssetsBaseUrl),
  specialtiesUrl: env.NEXT_PUBLIC_FILE_SERVER_SPECIALTIES_URL ?? DEFAULT_FILE_SERVER.specialtiesUrl,
  professionsUrl: env.NEXT_PUBLIC_FILE_SERVER_PROFESSIONS_URL ?? DEFAULT_FILE_SERVER.professionsUrl,
  countriesCitiesUrl: env.NEXT_PUBLIC_FILE_SERVER_COUNTRIES_CITIES_URL ?? DEFAULT_FILE_SERVER.countriesCitiesUrl,
  occupationsUrl: env.NEXT_PUBLIC_FILE_SERVER_OCCUPATIONS_URL ?? DEFAULT_FILE_SERVER.occupationsUrl,
  symptomsUrl: env.NEXT_PUBLIC_FILE_SERVER_SYMPTOMS_URL ?? DEFAULT_FILE_SERVER.symptomsUrl,
  therapyGoalsUrl: env.NEXT_PUBLIC_FILE_SERVER_THERAPY_GOALS_URL ?? DEFAULT_FILE_SERVER.therapyGoalsUrl
} as const;

export function buildPublicAssetUrl(objectKey?: string) {
  if (!objectKey || !fileServer.publicAssetsBaseUrl) return undefined;
  const cleanKey = objectKey.replace(/^\//, "");
  // Use encodeURI to encode spaces and special characters while preserving path structure
  const encoded = encodeURI(cleanKey);
  return `${fileServer.publicAssetsBaseUrl}/${encoded}`;
}

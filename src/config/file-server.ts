import { env } from "@/config/env";

const DEFAULT_FILE_SERVER = {
  logoUrl: "https://res.cloudinary.com/demo/image/upload/corazon-migrante/global_assets/media/logo-corazon-migrante.png",
  authImageUrl: "https://res.cloudinary.com/demo/image/upload/corazon-migrante/landing_page/media/story_page_image.avif",
  landingHeroImageUrl: "https://res.cloudinary.com/demo/image/upload/corazon-migrante/landing_page/media/landing_hero.jpg",
  therapyImageUrl: "https://res.cloudinary.com/demo/image/upload/corazon-migrante/landing_page/media/therapy.jpg",
  familyImageUrl: "https://res.cloudinary.com/demo/image/upload/corazon-migrante/landing_page/media/family.jpg",
  libraryImageUrl: "https://res.cloudinary.com/demo/image/upload/corazon-migrante/landing_page/media/library.jpg",
  editorialHeroImageUrl: "https://res.cloudinary.com/demo/image/upload/corazon-migrante/landing_page/media/editorial_hero.jpg",
  editorialFallbackImageUrl: "https://res.cloudinary.com/demo/image/upload/corazon-migrante/landing_page/media/editorial_fallback.jpg",
  specialtiesUrl: "",
  professionsUrl: "",
  countriesCitiesUrl: "",
  occupationsUrl: "",
  symptomsUrl: "",
  therapyGoalsUrl: "",
  publicAssetsBaseUrl: "https://res.cloudinary.com/demo/image/upload/corazon-migrante"
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

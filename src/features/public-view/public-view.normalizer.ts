/**
 * API pública del normalizador de la landing.
 *
 * Convierte cualquiera de los formatos que devuelve el backend (vista pública,
 * página de CMS y dos formatos heredados) en un `NormalizedPublicLanding`.
 *
 * La implementación vive en `./normalizer/`: este archivo superaba las 1000
 * líneas y mezclaba coerción de tipos, construcción de piezas y detección de
 * formato en un solo sitio.
 */
import { fileServer } from "@/config/file-server";
import { asRecord, normalizeAssetUrl, unwrapData } from "@/features/public-view/normalizer/primitives";
import { normalizeUiById, resolveUiAsset } from "@/features/public-view/normalizer/ui-assets";
import { normalizeLegacyContent, normalizeOldPageJson } from "@/features/public-view/normalizer/legacy-formats";
import { normalizeCmsPage, normalizePublicView } from "@/features/public-view/normalizer/formats";
import type {
  LandingImage,
  LandingNavbar,
  NormalizedPublicLanding,
  UiElementAsset,
} from "@/features/public-view/public-view.types";

export function normalizePublicLandingResponse(
  payload: unknown,
): NormalizedPublicLanding {
  const raw = unwrapData(payload);
  const record = asRecord(raw);
  const rootContent = asRecord(record.content);
  const nestedData = asRecord(record.data);
  const nestedContent = asRecord(nestedData.content);

  if (record.publicView || record.public_view) {
    return normalizePublicView(
      asRecord(record.publicView ?? record.public_view),
      payload,
    );
  }

  if (
    record.id_vista ||
    record.id_vista_publica ||
    record.viewId ||
    record.view_id ||
    record.publicViewType ||
    record.public_view_type
  ) {
    return normalizePublicView(record, payload);
  }

  if (Object.keys(rootContent).length > 0) {
    const uiById = normalizeUiById(
      record.uiById ?? record.ui_by_id ?? record.data ?? record.assets,
    );
    return normalizeLegacyContent(rootContent, uiById, payload);
  }

  if (Object.keys(nestedContent).length > 0) {
    const uiById = normalizeUiById(
      nestedData.uiById ?? nestedData.ui_by_id ?? nestedData.assets,
    );
    return normalizeLegacyContent(nestedContent, uiById, payload);
  }

  if (
    record.pagina_1 ||
    record.pagina_2 ||
    record.pagina_3 ||
    record.pagina_4
  ) {
    return normalizeOldPageJson(
      record,
      normalizeUiById(record.uiById ?? record.ui_by_id ?? record.assets),
    );
  }

  if (
    Array.isArray(record.elements) ||
    Array.isArray(record.elementos) ||
    record.slug ||
    record.seoMetadata ||
    record.seo_metadata
  ) {
    return normalizeCmsPage(record, payload);
  }

  if (
    record.navbar ||
    record.hero ||
    record.sections ||
    record.footer ||
    record.presentation_section
  ) {
    return normalizeLegacyContent(
      record,
      normalizeUiById(record.uiById ?? record.ui_by_id ?? record.assets),
      payload,
    );
  }

  return normalizeCmsPage(record, payload);
}

export function resolveLandingImage(
  image: LandingImage | undefined,
  uiById: Record<number, UiElementAsset>,
  fallback?: string,
) {
  const direct = normalizeAssetUrl(image?.src);
  if (direct) return direct;
  const asset = resolveUiAsset(uiById, image?.idUi);
  if (asset?.url) return asset.url;
  return normalizeAssetUrl(fallback);
}

export function resolveLogoUrl(
  navbar: LandingNavbar,
  uiById: Record<number, UiElementAsset>,
) {
  const asset = resolveUiAsset(uiById, navbar.logoIdUi);
  return asset?.url ?? normalizeAssetUrl(fileServer.logoUrl);
}

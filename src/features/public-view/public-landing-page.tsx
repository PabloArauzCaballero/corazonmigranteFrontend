/**
 * Página de aterrizaje pública.
 *
 * Decide entre el formato v2 y la landing genérica; cada bloque de esta última
 * vive en `./public-landing/`.
 */
import { resolveContactPhone } from "@/features/landing/contact";
import { LandingV2Page } from "@/features/public-view/landing-v2-page";
import { extractLandingV2 } from "@/features/public-view/landing-v2.mapper";
import type { NormalizedPublicLanding } from "@/features/public-view/public-view.types";
import { GenericPublicLandingPage } from "@/features/public-view/public-landing/generic";

export function PublicLandingPage({
  landing,
}: {
  landing: NormalizedPublicLanding;
}) {
  const landingV2 = extractLandingV2(landing.raw);
  const phone = resolveContactPhone(landingV2?.telefono ?? landingV2?.phone ?? landing.phone);

  if (landingV2) {
    return <LandingV2Page content={landingV2} landing={landing} phone={phone} />;
  }

  return <GenericPublicLandingPage landing={landing} />;
}

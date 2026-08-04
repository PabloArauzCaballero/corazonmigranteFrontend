/**
 * Composición de una sección genérica a partir de sus piezas.
 *
 * Extraído de `public-view.normalizer.ts`, que superaba las 1000 líneas.
 */
import { asArray, asRecord, asString, asStringArray, firstString } from "@/features/public-view/normalizer/primitives";
import { cardFrom, imageFrom, linkFrom, numberedContainers, readContentContainer, withFileIdFallback } from "@/features/public-view/normalizer/parts";
import { textFromIconText } from "@/features/public-view/normalizer/blocks";
import type {
  LandingCard,
  LandingSection,
  UiElementAsset,
} from "@/features/public-view/public-view.types";

export function sectionFrom(
  code: string,
  value: unknown,
  uiById: Record<number, UiElementAsset>,
  index = 0,
): LandingSection | null {
  const record = readContentContainer(value);
  const title = firstString(
    record.title,
    record.titulo,
    record.titulo_principal,
    record.name,
    record.nombre,
    record.heading,
  );
  const subtitle = firstString(
    record.subtitle,
    record.subtitulo,
    record.subtitulo_principal,
    record.entradilla,
  );
  const body = firstString(
    record.body,
    record.parrafo,
    record.parrafo_principal,
    record.description,
    record.descripcion,
    record.text,
    record.texto,
  );
  const paragraphs = asStringArray(
    record.paragraphs ??
      record.parrafos ??
      record.descriptionList ??
      record.lista_descripcion,
  );
  const explicitItems = asArray(
    record.items ??
      record.cards ??
      record.tarjetas ??
      record.specialists ??
      record.psicologos ??
      record.features,
  )
    .map((item) => cardFrom(item, uiById))
    .filter(Boolean) as LandingCard[];
  const inferredItems = numberedContainers(record, "contenedor_", uiById);
  const items = explicitItems.length > 0 ? explicitItems : inferredItems;
  const elementRecord = asRecord(value);
  const image = withFileIdFallback(
    imageFrom(
      record.image ?? record.img ?? record.media ?? record.imagen ?? record.foto,
      uiById,
    ),
    elementRecord.fileId ?? elementRecord.file_id,
  );
  const primaryCta = linkFrom(
    record.primaryCta ?? record.primary_cta ?? record.cta,
  );
  const secondaryCta = linkFrom(record.secondaryCta ?? record.secondary_cta);
  const layout = asString(record.layout) as
    LandingSection["layout"] | undefined;

  if (
    !title &&
    !subtitle &&
    !body &&
    paragraphs.length === 0 &&
    items.length === 0 &&
    !image?.src &&
    !primaryCta
  )
    return null;

  return {
    id:
      firstString(record.id, record.slug, record.anchor) ??
      code.replace(/_/g, "-") ??
      `section-${index + 1}`,
    code,
    label: firstString(record.label, record.etiqueta),
    badge: textFromIconText(record.badge ?? record.kicker),
    title,
    subtitle,
    body,
    paragraphs,
    image,
    items,
    primaryCta,
    secondaryCta,
    layout,
  };
}

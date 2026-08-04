/**
 * Catálogo de assets de interfaz (`ui`) indexado por id.
 *
 * Vive aparte de `parts` a propósito: ambos se necesitaban mutuamente y eso
 * creaba una dependencia circular.
 *
 * Extraído de `public-view.normalizer.ts`, que superaba las 1000 líneas.
 */
import { asRecord, asString, firstString, isRecord, normalizeAssetUrl, parseJsonMaybe, toNumber } from "@/features/public-view/normalizer/primitives";
import type {
  UiElementAsset,
} from "@/features/public-view/public-view.types";

export function normalizeUiById(raw: unknown): Record<number, UiElementAsset> {
  const out: Record<number, UiElementAsset> = {};
  const parsed = parseJsonMaybe(raw);
  const entries = Array.isArray(parsed)
    ? parsed.map(
        (value, index) =>
          [
            String(
              (value as { id?: unknown; id_elemento?: unknown })?.id ??
                (value as { id_elemento?: unknown })?.id_elemento ??
                index,
            ),
            value,
          ] as [string, unknown],
      )
    : isRecord(parsed)
      ? Object.entries(parsed)
      : [];

  for (const [key, value] of entries) {
    const row = asRecord(value);
    const metadata = asRecord(row.metadata);
    const id =
      toNumber(key) ??
      toNumber(
        row.id_elemento ??
          row.id ??
          row.uiId ??
          row.ui_id ??
          row.elementId ??
          row.element_id,
      );
    if (!id) continue;
    const url = normalizeAssetUrl(
      firstString(
        row.link,
        row.url,
        row.publicUrl,
        row.public_url,
        row.fileUrl,
        row.file_url,
        row.path,
        row.objectKey,
        row.object_key,
        metadata.url,
        metadata.publicUrl,
        metadata.public_url,
        metadata.fileUrl,
        metadata.file_url,
        metadata.path,
        metadata.objectKey,
        metadata.object_key,
      ),
    );
    const alt = asString(
      row.alt ?? metadata.alt ?? row.descripcion ?? row.description,
    );
    out[id] = {
      id,
      type: asString(row.tipo ?? row.type) ?? "",
      value: asString(row.valor ?? row.value),
      url,
      alt,
      metadata,
    };
  }

  return out;
}

export function resolveUiAsset(uiById: Record<number, UiElementAsset>, idUi: unknown) {
  const id = toNumber(idUi);
  if (!id) return undefined;
  return uiById[id];
}

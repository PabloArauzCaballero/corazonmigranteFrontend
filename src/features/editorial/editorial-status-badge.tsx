import { Badge } from "@/shared/ui/badge";
import type { CmsElementStatus, CmsPageStatus } from "@/features/editorial/editorial.types";

export function CmsPageStatusBadge({ status }: { status: CmsPageStatus }) {
  const variant = status === "PUBLISHED" ? "success" : "warning";
  return <Badge variant={variant}>{status === "PUBLISHED" ? "Publicado" : "Borrador"}</Badge>;
}

export function CmsElementStatusBadge({ status }: { status: CmsElementStatus }) {
  return <Badge variant={status === "ACTIVE" ? "success" : "muted"}>{status === "ACTIVE" ? "Activo" : "Inactivo"}</Badge>;
}

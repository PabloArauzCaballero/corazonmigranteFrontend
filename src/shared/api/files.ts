import { env } from "@/config/env";
import { ENDPOINTS } from "@/shared/api/endpoints";

export function buildFileDownloadUrl(fileId?: string | null) {
  if (!fileId) return undefined;
  const baseUrl = env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) return undefined;
  const path = ENDPOINTS.files.download.replace(":fileId", encodeURIComponent(fileId));
  return `${baseUrl}${path}`;
}

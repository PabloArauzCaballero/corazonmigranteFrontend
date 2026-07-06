import { env } from "@/config/env";
import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";

export function buildFileDownloadUrl(fileId?: string | null) {
  if (!fileId) return undefined;
  const baseUrl = env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) return undefined;
  const path = ENDPOINTS.files.download.replace(":fileId", encodeURIComponent(fileId));
  return `${baseUrl}${path}`;
}

export type UploadFileInput = {
  file: File;
  module: "USER_PROFILE" | "THERAPY_CATALOG" | "CMS" | "APPOINTMENT";
  entityType?: string;
  entityId?: string;
  visibility?: "PRIVATE" | "PUBLIC";
};

type UploadedFile = { id?: string; fileId?: string; uuid?: string };

function extractUploadedFileId(payload: unknown): string | undefined {
  if (typeof payload !== "object" || payload === null) return undefined;
  const record = payload as Record<string, unknown> & { data?: UploadedFile };
  const source = (record.data ?? record) as UploadedFile;
  return source.id ?? source.fileId ?? source.uuid;
}

/** Sube un archivo al backend (`POST /files`, multipart/form-data) y devuelve el id del archivo creado. */
export async function uploadFile(input: UploadFileInput) {
  const formData = new FormData();
  formData.append("file", input.file);
  formData.append("module", input.module);
  if (input.entityType) formData.append("entityType", input.entityType);
  if (input.entityId) formData.append("entityId", input.entityId);
  if (input.visibility) formData.append("visibility", input.visibility);

  const payload = await apiRequest<unknown>(ENDPOINTS.files.upload, {
    method: "POST",
    body: formData,
    auth: true
  });

  return { fileId: extractUploadedFileId(payload), raw: payload };
}

/** Sube la foto de perfil de un usuario, vinculada por módulo USER_PROFILE y entityId del usuario. */
export async function uploadUserPhoto(userId: string, file: File) {
  return uploadFile({ file, module: "USER_PROFILE", entityType: "USER", entityId: userId, visibility: "PUBLIC" });
}

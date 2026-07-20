import { env } from "@/config/env";
import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { ApiError } from "@/shared/api/errors";

const API_PREFIX_PATTERN = /\/(api\/v1|api)$/i;
const DIRECT_CLOUDINARY_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

function normalizedApiBaseUrl() {
  const baseUrl = env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "").replace(API_PREFIX_PATTERN, "");
  return baseUrl || undefined;
}

export function buildFileDownloadUrl(fileId?: string | null) {
  if (!fileId) return undefined;
  const baseUrl = normalizedApiBaseUrl();
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
  admin?: boolean;
};

type UploadedFile = {
  id?: string;
  fileId?: string;
  uuid?: string;
  url?: string;
  publicUrl?: string;
  downloadUrl?: string;
};

type CloudinarySignatureResponse = {
  provider: "CLOUDINARY";
  cloudName: string;
  apiKey: string;
  timestamp: number;
  expiresAt: number;
  expiresInSeconds: number;
  publicId: string;
  signature: string;
  uploadUrl: string;
  uploadParams?: Record<string, string | number>;
  uploadToken: string;
};

type CloudinaryUploadResponse = {
  asset_id?: string;
  public_id: string;
  secure_url?: string;
  url?: string;
  version?: number | string;
  format?: string;
  resource_type?: string;
  bytes?: number;
  signature?: string;
};

function unwrapData<T>(payload: T | { data?: T }): T {
  if (typeof payload === "object" && payload !== null && "data" in payload) {
    return ((payload as { data?: T }).data ?? payload) as T;
  }
  return payload as T;
}

function extractUploadedFileId(payload: unknown): string | undefined {
  if (typeof payload !== "object" || payload === null) return undefined;
  const record = payload as Record<string, unknown> & { data?: UploadedFile };
  const source = (record.data ?? record) as UploadedFile;
  return source.id ?? source.fileId ?? source.uuid;
}

function extractUploadedFileSource(payload: unknown): UploadedFile {
  const record = (typeof payload === "object" && payload !== null ? payload : {}) as { data?: UploadedFile } & UploadedFile;
  return (record.data ?? record) as UploadedFile;
}

function supportsDirectCloudinary(file: File) {
  return DIRECT_CLOUDINARY_MIME_TYPES.has(file.type);
}

async function uploadFileThroughServidor(input: UploadFileInput) {
  const formData = new FormData();
  formData.append("file", input.file);
  formData.append("module", input.module);
  if (input.entityType) formData.append("entityType", input.entityType);
  if (input.entityId) formData.append("entityId", input.entityId);
  formData.append("visibility", input.visibility ?? "PUBLIC");

  const payload = await apiRequest<unknown>(input.admin ? ENDPOINTS.files.adminUpload : ENDPOINTS.files.upload, {
    method: "POST",
    body: formData,
    auth: true
  });

  const source = extractUploadedFileSource(payload);
  return { fileId: extractUploadedFileId(payload), url: source.publicUrl ?? source.downloadUrl ?? source.url, raw: payload };
}

async function requestCloudinarySignature(input: UploadFileInput) {
  const endpoint = input.admin ? ENDPOINTS.files.adminCloudinarySignature : ENDPOINTS.files.cloudinarySignature;
  const payload = await apiRequest<CloudinarySignatureResponse | { data?: CloudinarySignatureResponse }>(endpoint, {
    method: "POST",
    auth: true,
    body: {
      module: input.module,
      originalName: input.file.name,
      mimeType: input.file.type,
      sizeBytes: input.file.size,
      entityType: input.entityType,
      entityId: input.entityId,
      visibility: "PUBLIC"
    }
  });
  return unwrapData(payload);
}

async function uploadDirectlyToCloudinary(input: UploadFileInput, signature: CloudinarySignatureResponse) {
  const formData = new FormData();
  formData.append("file", input.file);
  for (const [key, value] of Object.entries(signature.uploadParams ?? {})) {
    formData.append(key, String(value));
  }
  formData.set("api_key", signature.apiKey);
  formData.set("timestamp", String(signature.timestamp));
  formData.set("public_id", signature.publicId);
  formData.set("signature", signature.signature);

  const response = await fetch(signature.uploadUrl, {
    method: "POST",
    body: formData
  });
  const payload = (await response.json().catch(() => null)) as CloudinaryUploadResponse | Record<string, unknown> | null;

  if (!response.ok) {
    throw new ApiError("Cloudinary no pudo recibir la imagen.", response.status, payload);
  }

  const uploaded = payload as CloudinaryUploadResponse;
  const secureUrl = uploaded.secure_url ?? uploaded.url;
  if (!uploaded.public_id || !secureUrl) {
    throw new ApiError("Cloudinary no devolvió public_id o secure_url.", 502, payload);
  }

  return uploaded;
}

async function completeCloudinaryUpload(input: UploadFileInput, signature: CloudinarySignatureResponse, uploaded: CloudinaryUploadResponse) {
  const endpoint = input.admin ? ENDPOINTS.files.adminCloudinaryComplete : ENDPOINTS.files.cloudinaryComplete;
  const payload = await apiRequest<unknown>(endpoint, {
    method: "POST",
    auth: true,
    body: {
      uploadToken: signature.uploadToken,
      publicId: uploaded.public_id,
      secureUrl: uploaded.secure_url ?? uploaded.url,
      assetId: uploaded.asset_id,
      version: uploaded.version !== undefined ? String(uploaded.version) : undefined,
      format: uploaded.format,
      resourceType: uploaded.resource_type,
      bytes: uploaded.bytes,
      signature: uploaded.signature
    }
  });
  const source = extractUploadedFileSource(payload);
  return { fileId: extractUploadedFileId(payload), url: source.publicUrl ?? source.downloadUrl ?? source.url, raw: payload };
}

/**
 * Sube imagenes publicas directo a Cloudinary y luego registra la URL en el backend.
 * Los archivos no-imagen conservan el endpoint multipart legacy.
 */
export async function uploadFile(input: UploadFileInput) {
  if (!supportsDirectCloudinary(input.file)) {
    return uploadFileThroughServidor(input);
  }

  const publicInput = { ...input, visibility: "PUBLIC" as const };
  const signature = await requestCloudinarySignature(publicInput);
  const uploaded = await uploadDirectlyToCloudinary(publicInput, signature);
  return completeCloudinaryUpload(publicInput, signature, uploaded);
}

/** Sube la foto de perfil de un usuario, vinculada por módulo USER_PROFILE y entityId del usuario. */
export async function uploadUserPhoto(userId: string, file: File) {
  return uploadFile({ file, module: "USER_PROFILE", entityType: "USER", entityId: userId, visibility: "PUBLIC" });
}

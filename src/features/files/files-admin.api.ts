import { apiRequest } from "@/shared/api/client";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { normalizePaginatedResponse } from "@/shared/api/normalizers";
import { uploadFile, type UploadFileInput } from "@/shared/api/files";

export type ManagedFile = {
  id: string;
  fileId?: string;
  module: string;
  entityType?: string | null;
  entityId?: string | null;
  storageProvider: string;
  bucket?: string | null;
  objectKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  visibility: "PRIVATE" | "PUBLIC" | string;
  status: "ACTIVE" | "ARCHIVED" | string;
  url?: string | null;
  publicUrl?: string | null;
  downloadUrl?: string | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type FilesPage = { items: ManagedFile[]; pagination?: { page: number; totalPages: number; total: number; pageSize: number } };

function pathParam(path: string, key: string, value: string) {
  return path.replace(`:${key}`, encodeURIComponent(value));
}

function unwrapItems(payload: unknown) {
  const source = payload && typeof payload === "object" && "data" in payload ? (payload as { data: unknown }).data : payload;
  return normalizePaginatedResponse(source, (item) => item as ManagedFile, { page: 1, pageSize: 20 }) as FilesPage;
}

export const filesAdminApi = {
  async list(params: { page?: number; search?: string } = {}) {
    const query = new URLSearchParams();
    query.set("page", String(params.page ?? 1));
    query.set("pageSize", "20");
    if (params.search?.trim()) query.set("search", params.search.trim());
    return unwrapItems(await apiRequest<unknown>(`${ENDPOINTS.files.adminList}?${query.toString()}`));
  },

  async upload(input: { file: File; module: string; visibility: string; entityType?: string; entityId?: string }) {
    const uploaded = await uploadFile({
      file: input.file,
      module: input.module as UploadFileInput["module"],
      visibility: input.visibility as UploadFileInput["visibility"],
      entityType: input.entityType,
      entityId: input.entityId
    });
    return (uploaded.raw && typeof uploaded.raw === "object" && "data" in uploaded.raw
      ? (uploaded.raw as { data: ManagedFile }).data
      : uploaded.raw) as ManagedFile;
  },

  async update(id: string, input: Partial<Pick<ManagedFile, "module" | "entityType" | "entityId" | "visibility" | "status" | "originalName">>) {
    return apiRequest<ManagedFile>(pathParam(ENDPOINTS.files.adminUpdate, "fileId", id), { method: "PATCH", body: input });
  },

  async remove(id: string) {
    return apiRequest<{ id: string; deleted: boolean }>(pathParam(ENDPOINTS.files.adminDelete, "fileId", id), { method: "DELETE" });
  }
};

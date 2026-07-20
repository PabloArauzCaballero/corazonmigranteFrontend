"use client";

import { type DragEvent, FormEvent, useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileImage, RefreshCw, Search, Trash2, UploadCloud } from "lucide-react";
import { filesAdminApi, type ManagedFile } from "@/features/files/files-admin.api";
import { humanizeApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { DataTable, DataTableSkeleton, PaginationBar } from "@/shared/ui/data-table";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ErrorState } from "@/shared/ui/state";
import { cn } from "@/lib/utils";

const selectClass =
  "focus-ring flex h-11 w-full rounded-xl border bg-background px-4 py-2 text-sm transition-colors hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50";

function prettyBytes(value: number) {
  if (!Number.isFinite(value)) return "—";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-BO", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function fileUrl(file: ManagedFile) {
  return file.publicUrl ?? file.downloadUrl ?? file.url ?? null;
}

// ── Drag-and-drop upload zone ──────────────────────────────────────
function DropZone({
  onFile,
  selectedFile,
  accept = "image/png,image/jpeg,image/webp,application/pdf",
}: {
  onFile: (f: File) => void;
  selectedFile: File | null;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200",
        dragging
          ? "border-primary bg-primary/10 scale-[1.01]"
          : selectedFile
          ? "border-emerald-400 bg-emerald-50"
          : "border-muted-foreground/25 bg-muted/30 hover:border-primary/40 hover:bg-primary/5"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
      />
      {selectedFile ? (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
            <FileImage className="h-7 w-7 text-emerald-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-800">{selectedFile.name}</p>
            <p className="text-xs text-emerald-600">{prettyBytes(selectedFile.size)} · listo para subir</p>
          </div>
          <p className="text-xs text-muted-foreground">Haz clic para cambiar el archivo</p>
        </>
      ) : (
        <>
          <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-200", dragging ? "bg-primary/20" : "bg-muted")}>
            <UploadCloud className={cn("h-7 w-7 transition-colors duration-200", dragging ? "text-primary" : "text-muted-foreground")} />
          </div>
          <div>
            <p className="text-sm font-semibold">{dragging ? "Suelta el archivo aquí" : "Arrastra un archivo o haz clic"}</p>
            <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WebP o PDF · Máximo 10 MB</p>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────
export function FilesAdmin() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [module_, setModule] = useState("CMS");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [entityType, setEntityType] = useState("");
  const [notice, setNotice] = useState<{ message?: string; error?: string }>({});

  const files = useQuery({
    queryKey: ["admin-files", page, search],
    queryFn: () => filesAdminApi.list({ page, search }),
  });

  const refresh = () => void qc.invalidateQueries({ queryKey: ["admin-files"] });

  const uploadMutation = useMutation({
    mutationFn: filesAdminApi.upload,
    onSuccess: () => {
      setNotice({ message: "Archivo subido y registrado correctamente." });
      setSelectedFile(null);
      refresh();
    },
    onError: (error) => setNotice({ error: humanizeApiError(error) }),
  });

  function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFile) { setNotice({ error: "Selecciona o arrastra un archivo." }); return; }
    uploadMutation.mutate({
      file: selectedFile,
      module: module_,
      visibility,
      entityType: entityType.trim() || undefined,
      entityId: undefined,
    });
  }

  const updateMutation = useMutation({
    mutationFn: ({ file, field, value }: { file: ManagedFile; field: "visibility" | "status"; value: string }) =>
      filesAdminApi.update(file.id, { [field]: value }),
    onSuccess: () => { setNotice({ message: "Archivo actualizado." }); refresh(); },
    onError: (error) => setNotice({ error: humanizeApiError(error) }),
  });

  const deleteMutation = useMutation({
    mutationFn: (file: ManagedFile) => filesAdminApi.remove(file.id),
    onSuccess: () => { setNotice({ message: "Archivo eliminado del registro y del almacenamiento." }); refresh(); },
    onError: (error) => setNotice({ error: humanizeApiError(error) }),
  });

  const pagination = files.data?.pagination;
  const items = useMemo(() => files.data?.items ?? [], [files.data?.items]);

  return (
    <div className="grid gap-6">
      {/* ── Upload card ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UploadCloud className="h-5 w-5 text-primary" /> Subir archivo
          </CardTitle>
          <CardDescription>
            Sube imágenes (PNG, JPG, WebP) o documentos PDF. Se almacenan en Cloudinary o almacenamiento local según la configuración del servidor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notice.message && (
            <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {notice.message}
            </p>
          )}
          {notice.error && (
            <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {notice.error}
            </p>
          )}
          <form className="grid gap-5" onSubmit={submitUpload}>
            {/* Drop zone */}
            <DropZone onFile={setSelectedFile} selectedFile={selectedFile} />

            {/* Metadata fields */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Módulo</Label>
                <select className={selectClass} value={module_} onChange={(e) => setModule(e.target.value)}>
                  <option value="CMS">Biblioteca pública (CMS)</option>
                  <option value="USER_PROFILE">Perfil de usuario</option>
                  <option value="THERAPY_CATALOG">Catálogo de terapia</option>
                  <option value="APPOINTMENT">Cita clínica</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Visibilidad</Label>
                <select className={selectClass} value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                  <option value="PUBLIC">Público — accesible sin autenticación</option>
                  <option value="PRIVATE">Privado — requiere sesión</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de entidad <span className="text-muted-foreground">(opcional)</span></Label>
                <Input
                  placeholder="Ej: CmsElement, TherapyProduct"
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={uploadMutation.isPending} disabled={!selectedFile}>
                <UploadCloud className="h-4 w-4" /> Subir archivo
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── List card ── */}
      <div className="rounded-2xl border bg-card shadow-soft">
        {/* Filters header */}
        <div className="flex flex-wrap items-center gap-3 border-b px-5 py-4">
          <div className="relative flex-1 min-w-48">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre, módulo, tipo..."
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4" /> Actualizar
          </Button>
          {files.data && (
            <span className="text-xs text-muted-foreground">
              {files.data.pagination?.total ?? items.length} archivo{items.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Table */}
        <div className="p-5">
          {files.isLoading ? <DataTableSkeleton columns={7} rows={6} /> : null}
          {files.isError ? (
            <ErrorState
              title="No se pudieron cargar archivos"
              description={humanizeApiError(files.error)}
              actionLabel="Reintentar"
              onAction={() => void files.refetch()}
            />
          ) : null}
          {files.data ? (
            <DataTable<ManagedFile>
              data={items}
              getRowKey={(row) => row.id}
              emptyTitle="No hay archivos registrados"
              emptyDescription="Sube el primer archivo desde el área de arriba."
              columns={[
                {
                  key: "file",
                  header: "Archivo",
                  render: (row) => {
                    const url = fileUrl(row);
                    return (
                      <div className="flex items-start gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border bg-muted">
                          {url && row.mimeType?.startsWith("image/") ? (
                            <img src={url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <FileImage className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{row.originalName}</p>
                          <p className="text-xs text-muted-foreground">{row.mimeType} · {prettyBytes(row.sizeBytes)}</p>
                        </div>
                      </div>
                    );
                  },
                },
                {
                  key: "module",
                  header: "Módulo",
                  render: (row) => (
                    <div>
                      <p className="text-sm font-semibold">{row.module}</p>
                      <p className="text-xs text-muted-foreground">{row.entityType ?? "Sin entidad"}</p>
                    </div>
                  ),
                },
                {
                  key: "storage",
                  header: "Storage",
                  render: (row) => <span className="text-xs font-mono">{row.storageProvider}</span>,
                },
                {
                  key: "visibility",
                  header: "Visibilidad",
                  render: (row) => (
                    <select
                      className="rounded-xl border bg-background px-3 py-1.5 text-xs"
                      value={row.visibility}
                      onChange={(e) => updateMutation.mutate({ file: row, field: "visibility", value: e.target.value })}
                    >
                      <option value="PUBLIC">Público</option>
                      <option value="PRIVATE">Privado</option>
                    </select>
                  ),
                },
                {
                  key: "status",
                  header: "Estado",
                  render: (row) => (
                    <select
                      className={cn("rounded-xl border px-3 py-1.5 text-xs font-semibold", row.status === "ACTIVE" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-muted bg-muted text-muted-foreground")}
                      value={row.status}
                      onChange={(e) => updateMutation.mutate({ file: row, field: "status", value: e.target.value })}
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="ARCHIVED">Archivado</option>
                    </select>
                  ),
                },
                {
                  key: "date",
                  header: "Fecha",
                  render: (row) => <span className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</span>,
                },
                {
                  key: "actions",
                  header: "Acciones",
                  render: (row) => (
                    <div className="flex gap-2">
                      {fileUrl(row) ? (
                        <Button asChild size="icon" variant="outline" title="Descargar / ver">
                          <a href={fileUrl(row) ?? "#"} target="_blank" rel="noreferrer">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : null}
                      <Button
                        size="icon"
                        variant="destructive"
                        title="Eliminar"
                        loading={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm("¿Eliminar este archivo del registro y del almacenamiento?"))
                            deleteMutation.mutate(row);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          ) : null}
        </div>

        {/* Pagination inside same container */}
        {pagination && pagination.totalPages > 1 && (
          <div className="border-t px-5 py-3">
            <PaginationBar
              page={pagination.page}
              totalPages={pagination.totalPages}
              loading={files.isFetching}
              onPrevious={() => setPage((v) => Math.max(1, v - 1))}
              onNext={() => setPage((v) => Math.min(pagination.totalPages, v + 1))}
              onGoTo={(p) => setPage(p)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

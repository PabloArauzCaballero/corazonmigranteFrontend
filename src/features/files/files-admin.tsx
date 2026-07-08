"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileImage, RefreshCw, Search, Trash2, UploadCloud } from "lucide-react";
import { filesAdminApi, type ManagedFile } from "@/features/files/files-admin.api";
import { humanizeApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { DataTable, PaginationBar } from "@/shared/ui/data-table";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ErrorState, LoadingState } from "@/shared/ui/state";
import { cn } from "@/lib/utils";

const selectClass = "focus-ring flex h-14 w-full rounded-[14px] border border-slate-500/80 bg-[#fbfaf8] px-4 py-3 text-sm shadow-sm hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50";

function fileUrl(file: ManagedFile) {
  return file.publicUrl ?? file.downloadUrl ?? file.url ?? null;
}

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

function statusClass(status: string) {
  return cn("rounded-full px-2.5 py-1 text-xs font-bold", status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700");
}

export function FilesAdmin() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<{ message?: string; error?: string }>({});
  const files = useQuery({ queryKey: ["admin-files", page, search], queryFn: () => filesAdminApi.list({ page, search }) });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin-files"] });
  };

  const uploadMutation = useMutation({
    mutationFn: filesAdminApi.upload,
    onSuccess: () => {
      setNotice({ message: "Archivo subido y registrado correctamente." });
      refresh();
    },
    onError: (error) => setNotice({ error: humanizeApiError(error) })
  });

  function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setNotice({ error: "Selecciona un archivo para subir." });
      return;
    }
    uploadMutation.mutate(
      {
        file,
        module: String(form.get("module") ?? "CMS"),
        visibility: String(form.get("visibility") ?? "PUBLIC"),
        entityType: String(form.get("entityType") ?? "").trim() || undefined,
        entityId: String(form.get("entityId") ?? "").trim() || undefined
      },
      { onSuccess: () => formElement.reset() }
    );
  }

  const updateMutation = useMutation({
    mutationFn: ({ file, field, value }: { file: ManagedFile; field: "visibility" | "status"; value: string }) => filesAdminApi.update(file.id, { [field]: value }),
    onSuccess: () => { setNotice({ message: "Archivo actualizado." }); refresh(); },
    onError: (error) => setNotice({ error: humanizeApiError(error) })
  });

  const deleteMutation = useMutation({
    mutationFn: (file: ManagedFile) => filesAdminApi.remove(file.id),
    onSuccess: () => { setNotice({ message: "Archivo eliminado del registro y del almacenamiento." }); refresh(); },
    onError: (error) => setNotice({ error: humanizeApiError(error) })
  });

  const pagination = files.data?.pagination;
  const items = useMemo(() => files.data?.items ?? [], [files.data?.items]);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UploadCloud className="h-5 w-5" /> Subir archivo</CardTitle>
          <CardDescription>Gestiona registros de la tabla files y su objeto asociado en Cloudinary, GCS o almacenamiento local.</CardDescription>
        </CardHeader>
        <CardContent>
          {notice.message ? <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice.message}</p> : null}
          <p className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">Para imágenes públicas de la biblioteca editorial, perfiles y publicidad usa <b>STORAGE_PROVIDER=CLOUDINARY</b>. El navegador sube directo a Cloudinary con firma temporal y luego se registra la auditoría en la tabla <b>files</b>.</p>
          {notice.error ? <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{notice.error}</p> : null}
          <form className="grid gap-4 lg:grid-cols-[1.1fr_0.7fr_0.7fr_0.8fr_1fr_auto]" onSubmit={submitUpload}>
            <div className="space-y-2 lg:col-span-2">
              <Label>Archivo</Label>
              <Input name="file" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" required />
            </div>
            <div className="space-y-2">
              <Label>Módulo</Label>
              <select name="module" className={selectClass} defaultValue="CMS"><option value="CMS">Biblioteca pública</option><option value="USER_PROFILE">Perfil usuario</option><option value="THERAPY_CATALOG">Catálogo terapia</option><option value="APPOINTMENT">Cita</option></select>
            </div>
            <div className="space-y-2">
              <Label>Visibilidad</Label>
              <select name="visibility" className={selectClass} defaultValue="PUBLIC"><option value="PUBLIC">Público</option><option value="PRIVATE">Privado</option></select>
            </div>
            <div className="space-y-2">
              <Label>Tipo entidad</Label>
              <Input name="entityType" placeholder="CmsElement" />
            </div>
            <div className="space-y-2">
              <Label>ID entidad</Label>
              <Input name="entityId" placeholder="UUID opcional" />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={uploadMutation.isPending} className="h-14 rounded-[14px]"><UploadCloud className="h-4 w-4" /> Subir</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Archivos registrados</CardTitle>
          <CardDescription>Lista, filtra, descarga, archiva o elimina archivos. Eliminar también intenta borrar el objeto remoto.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form className="flex flex-col gap-3 md:flex-row" onSubmit={(event) => { event.preventDefault(); setPage(1); }}>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-11" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, módulo, tipo, mime u objeto" />
            </div>
            <Button type="button" variant="outline" className="h-14 rounded-[14px]" onClick={() => refresh()}><RefreshCw className="h-4 w-4" /> Actualizar</Button>
          </form>

          {files.isLoading ? <LoadingState title="Cargando archivos" /> : null}
          {files.isError ? <ErrorState title="No se pudieron cargar archivos" description={humanizeApiError(files.error)} actionLabel="Reintentar" onAction={() => void files.refetch()} /> : null}
          {files.data ? (
            <DataTable<ManagedFile>
              data={items}
              getRowKey={(row) => row.id}
              emptyTitle="No hay archivos registrados"
              emptyDescription="Sube el primer archivo desde el formulario superior."
              columns={[
                { key: "file", header: "Archivo", render: (row) => {
                  const url = fileUrl(row);
                  return <div className="flex items-start gap-3"><div className="grid h-12 w-12 place-items-center rounded-xl border bg-muted overflow-hidden">{url && row.mimeType.startsWith("image/") ? <img src={url} alt="" className="h-full w-full object-cover" /> : <FileImage className="h-5 w-5 text-muted-foreground" />}</div><div><p className="font-semibold">{row.originalName}</p><p className="text-xs text-muted-foreground">{row.mimeType} · {prettyBytes(row.sizeBytes)}</p><p className="mt-1 max-w-xs truncate font-mono text-[11px] text-muted-foreground">{row.id}</p></div></div>;
                } },
                { key: "module", header: "Módulo", render: (row) => <div><b>{row.module}</b><p className="text-xs text-muted-foreground">{row.entityType ?? "Sin entidad"}</p></div> },
                { key: "storage", header: "Storage", render: (row) => <div><b>{row.storageProvider}</b><p className="max-w-[180px] truncate text-xs text-muted-foreground">{row.storageProvider === "CLOUDINARY" ? "Cloudinary" : row.bucket ?? "LOCAL"}</p></div> },
                { key: "visibility", header: "Visibilidad", render: (row) => <select className="rounded-xl border bg-background px-3 py-2 text-xs" value={row.visibility} onChange={(event) => updateMutation.mutate({ file: row, field: "visibility", value: event.target.value })}><option value="PUBLIC">Público</option><option value="PRIVATE">Privado</option></select> },
                { key: "status", header: "Estado", render: (row) => <select className={statusClass(row.status)} value={row.status} onChange={(event) => updateMutation.mutate({ file: row, field: "status", value: event.target.value })}><option value="ACTIVE">Activo</option><option value="ARCHIVED">Archivado</option></select> },
                { key: "date", header: "Fecha", render: (row) => <span className="text-xs text-muted-foreground">{formatDate(row.createdAt)}</span> },
                { key: "actions", header: "Acciones", render: (row) => <div className="flex gap-2">{fileUrl(row) ? <Button asChild size="icon" variant="outline" title="Descargar"><a href={fileUrl(row) ?? "#"} target="_blank" rel="noreferrer"><Download className="h-4 w-4" /></a></Button> : null}<Button size="icon" variant="destructive" title="Eliminar" disabled={deleteMutation.isPending} onClick={() => { if (window.confirm("¿Eliminar este archivo y su objeto de almacenamiento?")) deleteMutation.mutate(row); }}><Trash2 className="h-4 w-4" /></Button></div> }
              ]}
            />
          ) : null}
          {pagination ? <PaginationBar page={pagination.page} totalPages={pagination.totalPages || 1} onPrevious={() => setPage((value) => Math.max(1, value - 1))} onNext={() => setPage((value) => Math.min(pagination.totalPages || value + 1, value + 1))} /> : null}
        </CardContent>
      </Card>
    </div>
  );
}

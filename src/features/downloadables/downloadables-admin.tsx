"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Plus, RefreshCw, Search, ShoppingCart, Layers } from "lucide-react";
import {
  adminApproveVersion,
  adminArchiveDownloadable,
  adminCreateDownloadable,
  adminCreateVersion,
  adminGetMetrics,
  adminListDownloadables,
  adminListVersions,
  adminPublishVersion,
  adminSetHotmart,
  adminSubmitReview,
  type AdminDownloadable,
  type DownloadableVisibility,
} from "@/features/downloadables/downloadables.api";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { DataTable, DataTableSkeleton, PaginationBar } from "@/shared/ui/data-table";
import { TableShell } from "@/shared/ui/table-shell";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Modal } from "@/shared/ui/modal";
import { ErrorState } from "@/shared/ui/state";

const VISIBILITY_OPTS: { value: DownloadableVisibility; label: string }[] = [
  { value: "PUBLIC", label: "Público" },
  { value: "PREMIUM", label: "Premium" },
  { value: "PRIVATE", label: "Privado" },
  { value: "PURCHASE_REQUIRED", label: "Requiere compra" },
  { value: "UNLISTED", label: "No listado" },
];

function visibilityBadge(v: string): "default" | "success" | "warning" | "danger" | "secondary" | "muted" {
  switch (v) {
    case "PUBLIC": return "success";
    case "PREMIUM": return "warning";
    case "PURCHASE_REQUIRED": return "danger";
    case "PRIVATE": return "secondary";
    default: return "muted";
  }
}
function statusBadge(s: string): "default" | "success" | "warning" | "danger" | "secondary" | "muted" {
  switch (s) {
    case "PUBLISHED": return "success";
    case "IN_REVIEW": case "APPROVED": return "warning";
    case "REJECTED": case "CHANGES_REQUESTED": return "danger";
    case "ARCHIVED": return "muted";
    default: return "secondary";
  }
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-black">{value}</p>
      </CardContent>
    </Card>
  );
}

function CreateDownloadableModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [visibility, setVisibility] = useState<DownloadableVisibility>("PUBLIC");
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: adminCreateDownloadable,
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin-downloadables"] }); onClose(); },
    onError: (e) => setError(humanizeApiError(e)),
  });

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    mutation.mutate({
      title: String(f.get("title") ?? ""),
      shortDescription: String(f.get("shortDescription") ?? "") || undefined,
      category: String(f.get("category") ?? "") || undefined,
      coverUrl: String(f.get("coverUrl") ?? "") || undefined,
      fileUrl: String(f.get("fileUrl") ?? "") || undefined,
      visibility,
      requiresPremium: visibility === "PREMIUM",
      requiresPurchase: visibility === "PURCHASE_REQUIRED",
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo descargable" description="Se crea como borrador. Publícalo desde el flujo de versiones.">
      <form className="grid gap-4" onSubmit={submit}>
        <div className="grid gap-2"><Label>Título</Label><Input name="title" required /></div>
        <div className="grid gap-2"><Label>Descripción breve</Label><Input name="shortDescription" /></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2"><Label>Categoría</Label><Input name="category" placeholder="Guías, Audios…" /></div>
          <div className="grid gap-2">
            <Label>Visibilidad</Label>
            <select className="h-11 rounded-xl border bg-background px-3 text-sm" value={visibility} onChange={(e) => setVisibility(e.target.value as DownloadableVisibility)}>
              {VISIBILITY_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid gap-2"><Label>URL de portada</Label><Input name="coverUrl" placeholder="https://…" /></div>
        <div className="grid gap-2"><Label>URL del archivo</Label><Input name="fileUrl" placeholder="https://…" /></div>
        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={mutation.isPending}><Plus className="h-4 w-4" /> Crear</Button>
        </div>
      </form>
    </Modal>
  );
}

function HotmartModal({ row, onClose }: { row: AdminDownloadable; onClose: () => void }) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: (input: { hotmartProductId?: string; hotmartCheckoutUrl?: string }) => adminSetHotmart(row.id, input),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["admin-downloadables"] }); onClose(); },
    onError: (e) => setError(humanizeApiError(e)),
  });
  return (
    <Modal open onClose={onClose} title={`Hotmart — ${row.title}`} description="Los secretos de Hotmart viven solo en el backend. Aquí se guardan datos no sensibles.">
      <form className="grid gap-4" onSubmit={(e) => { e.preventDefault(); const f = new FormData(e.currentTarget); mutation.mutate({ hotmartProductId: String(f.get("productId") ?? "") || undefined, hotmartCheckoutUrl: String(f.get("checkoutUrl") ?? "") || undefined }); }}>
        <div className="grid gap-2"><Label>Product ID</Label><Input name="productId" defaultValue={row.hotmartProductId ?? ""} /></div>
        <div className="grid gap-2"><Label>URL de checkout</Label><Input name="checkoutUrl" defaultValue={row.hotmartCheckoutUrl ?? ""} placeholder="https://pay.hotmart.com/…" /></div>
        {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" loading={mutation.isPending}>Guardar</Button></div>
      </form>
    </Modal>
  );
}

function VersionsModal({ row, onClose }: { row: AdminDownloadable; onClose: () => void }) {
  const qc = useQueryClient();
  const versions = useQuery({ queryKey: ["downloadable-versions", row.id], queryFn: () => adminListVersions(row.id) });
  const invalidate = () => { void qc.invalidateQueries({ queryKey: ["downloadable-versions", row.id] }); void qc.invalidateQueries({ queryKey: ["admin-downloadables"] }); };
  const create = useMutation({ mutationFn: () => adminCreateVersion(row.id, "Nueva versión"), onSuccess: invalidate });
  const submit = useMutation({ mutationFn: (vid: string) => adminSubmitReview(row.id, vid), onSuccess: invalidate });
  const approve = useMutation({ mutationFn: (vid: string) => adminApproveVersion(row.id, vid), onSuccess: invalidate });
  const publish = useMutation({ mutationFn: (vid: string) => adminPublishVersion(row.id, vid), onSuccess: invalidate });

  return (
    <Modal open onClose={onClose} title={`Versiones — ${row.title}`} description="La versión publicada es inmutable. Crea una nueva versión para editar.">
      <div className="grid gap-3">
        <div className="flex justify-end"><Button size="sm" loading={create.isPending} onClick={() => create.mutate()}><Plus className="h-4 w-4" /> Nueva versión</Button></div>
        {versions.data?.map((v) => (
          <div key={v.id} className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
            <div>
              <p className="text-sm font-semibold">v{v.versionNumber} {v.isPublished ? "· publicada" : ""}</p>
              <Badge variant={statusBadge(v.status)}>{v.status}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {v.status === "DRAFT" && <Button size="sm" variant="outline" loading={submit.isPending} onClick={() => submit.mutate(v.id)}>Enviar a revisión</Button>}
              {v.status === "IN_REVIEW" && <Button size="sm" variant="outline" loading={approve.isPending} onClick={() => approve.mutate(v.id)}>Aprobar</Button>}
              {v.status === "APPROVED" && <Button size="sm" loading={publish.isPending} onClick={() => publish.mutate(v.id)}>Publicar</Button>}
            </div>
          </div>
        ))}
        {versions.data?.length === 0 && <p className="text-sm text-muted-foreground">Sin versiones.</p>}
      </div>
    </Modal>
  );
}

export function DownloadablesAdmin() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [hotmartRow, setHotmartRow] = useState<AdminDownloadable | null>(null);
  const [versionsRow, setVersionsRow] = useState<AdminDownloadable | null>(null);

  const metrics = useQuery({ queryKey: ["downloadable-metrics"], queryFn: adminGetMetrics });
  const query = useQuery({ queryKey: ["admin-downloadables", page, search], queryFn: () => adminListDownloadables(page, search || undefined) });
  const archive = useMutation({ mutationFn: (id: string) => adminArchiveDownloadable(id), onSuccess: () => void qc.invalidateQueries({ queryKey: ["admin-downloadables"] }) });

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="Total" value={metrics.data?.total ?? "…"} />
        <Metric label="Publicados" value={metrics.data?.published ?? "…"} />
        <Metric label="Premium" value={metrics.data?.premium ?? "…"} />
        <Metric label="Hotmart" value={metrics.data?.hotmart ?? "…"} />
        <Metric label="Descargas" value={metrics.data?.downloads ?? "…"} />
        <Metric label="Denegadas" value={metrics.data?.denied ?? "…"} />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Nuevo descargable</Button>
      </div>

      {query.isError ? (
        <ErrorState title="No se pudieron cargar los descargables" description={humanizeApiError(query.error)} actionLabel="Reintentar" onAction={() => void query.refetch()} />
      ) : (
        <TableShell
          filters={
            <>
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Buscar por título…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <Button size="sm" variant="outline" onClick={() => void query.refetch()}><RefreshCw className="h-4 w-4" /> Actualizar</Button>
            </>
          }
          footer={query.data ? <PaginationBar page={query.data.pagination.page} totalPages={query.data.pagination.totalPages} loading={query.isFetching} onPrevious={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => Math.min(query.data.pagination.totalPages, p + 1))} onGoTo={(p) => setPage(p)} /> : undefined}
        >
          {query.isLoading ? <DataTableSkeleton columns={5} rows={6} /> : null}
          {query.data ? (
            <DataTable<AdminDownloadable>
              data={query.data.items}
              getRowKey={(r) => r.id}
              emptyTitle="Sin descargables"
              emptyDescription="Crea el primero con el botón de arriba."
              columns={[
                { key: "title", header: "Recurso", render: (r) => (<div><p className="font-semibold">{r.title}</p><p className="text-xs text-muted-foreground">{r.category ?? "Sin categoría"} · v{r.version}</p></div>) },
                { key: "visibility", header: "Visibilidad", render: (r) => <Badge variant={visibilityBadge(r.visibility)}>{r.visibility}</Badge> },
                { key: "status", header: "Estado", render: (r) => <Badge variant={statusBadge(r.status)}>{r.status}</Badge> },
                { key: "downloads", header: "Descargas", render: (r) => <span className="text-sm font-semibold">{r.downloadCount}</span> },
                { key: "actions", header: "Acciones", render: (r) => (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setVersionsRow(r)}><Layers className="h-4 w-4" /> Versiones</Button>
                      <Button size="sm" variant="outline" onClick={() => setHotmartRow(r)}><ShoppingCart className="h-4 w-4" /> Hotmart</Button>
                      <Button size="sm" variant="ghost" onClick={() => archive.mutate(r.id)}>Archivar</Button>
                    </div>
                  ) },
              ]}
            />
          ) : null}
        </TableShell>
      )}

      <CreateDownloadableModal open={creating} onClose={() => setCreating(false)} />
      {hotmartRow && <HotmartModal row={hotmartRow} onClose={() => setHotmartRow(null)} />}
      {versionsRow && <VersionsModal row={versionsRow} onClose={() => setVersionsRow(null)} />}
    </div>
  );
}

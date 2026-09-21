"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  createPublicContentElement,
  deletePublicContentElement,
  listPublicContent,
  updatePublicContentElement,
  type PublicContentElementInput,
  type PublicContentRow
} from "@/features/public-content/public-content.api";
import { SectionEditorModal } from "@/features/public-content/public-content-editor";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { useConfirm } from "@/shared/ui/confirm-dialog";
import { DataTable, DataTableSkeleton, PaginationBar } from "@/shared/ui/data-table";
import { Input } from "@/shared/ui/input";
import { Modal } from "@/shared/ui/modal";
import { ErrorState } from "@/shared/ui/state";
import { TableShell } from "@/shared/ui/table-shell";
import { useToast } from "@/shared/ui/toast";

const PAGE_SIZE = 20;
const QUERY_KEY = "public-content";

function contentPreview(row: PublicContentRow) {
  const entries = Object.entries(row.content);
  if (entries.length === 0) return "Sin contenido";
  return entries
    .map(([key, value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`)
    .join(" · ");
}

/** Vista de solo lectura: qué guarda exactamente la sección, sin riesgo de tocarla. */
function SectionPreviewModal({ row, onClose }: { row: PublicContentRow | null; onClose: () => void }) {
  return (
    <Modal
      open={Boolean(row)}
      onClose={onClose}
      title={row ? `Sección: ${row.name}` : "Sección"}
      description={row ? `Código ${row.code || "—"} · tipo ${row.type} · orden ${row.sortOrder}` : undefined}
    >
      <dl className="grid gap-3">
        {Object.entries(row?.content ?? {}).map(([key, value]) => (
          <div key={key} className="grid gap-1 border-b pb-3 last:border-b-0">
            <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{key}</dt>
            <dd className="whitespace-pre-wrap break-words text-sm">
              {typeof value === "object" ? JSON.stringify(value, null, 2) : String(value)}
            </dd>
          </div>
        ))}
        {Object.keys(row?.content ?? {}).length === 0 ? (
          <p className="text-sm text-muted-foreground">Esta sección no tiene campos de contenido.</p>
        ) : null}
      </dl>
      <div className="mt-6 flex justify-end">
        <Button type="button" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Modal>
  );
}

export function PublicContentTable() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<PublicContentRow | null>(null);
  const [editing, setEditing] = useState<PublicContentRow | null>(null);
  const [creating, setCreating] = useState(false);

  const query = useQuery({
    queryKey: [QUERY_KEY, { page, pageSize: PAGE_SIZE }],
    queryFn: () => listPublicContent({ page, pageSize: PAGE_SIZE })
  });

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  }

  const updateMutation = useMutation({
    mutationFn: ({ row, input }: { row: PublicContentRow; input: PublicContentElementInput }) =>
      updatePublicContentElement(row.pageId, row.id, input),
    onSuccess: async () => {
      setEditing(null);
      toast({ variant: "success", title: "Sección actualizada", description: "Los cambios ya se ven en la página pública." });
      await refresh();
    }
  });

  const createMutation = useMutation({
    mutationFn: (input: PublicContentElementInput) => {
      const pageId = query.data?.pageInfo.id;
      if (!pageId) throw new Error("Todavía no se sabe a qué página añadir la sección.");
      return createPublicContentElement(pageId, input);
    },
    onSuccess: async () => {
      setCreating(false);
      toast({ variant: "success", title: "Sección creada", description: "Ya forma parte de la página." });
      await refresh();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (row: PublicContentRow) => deletePublicContentElement(row.pageId, row.id),
    onSuccess: async () => {
      toast({ variant: "success", title: "Sección eliminada" });
      await refresh();
    },
    onError: (error) => {
      toast({ variant: "danger", title: "No se pudo eliminar", description: humanizeApiError(error) });
    }
  });

  async function onDelete(row: PublicContentRow) {
    const confirmed = await confirm({
      title: `¿Eliminar la sección "${row.name}"?`,
      description: "Dejará de mostrarse en la página pública. Queda registrada en la auditoría, pero no se puede deshacer desde el panel.",
      confirmLabel: "Eliminar sección",
      variant: "danger"
    });
    if (confirmed) deleteMutation.mutate(row);
  }

  const term = search.trim().toLowerCase();
  const rows = (query.data?.items ?? []).filter(
    (row) => !term || row.name.toLowerCase().includes(term) || row.code.toLowerCase().includes(term) || row.type.toLowerCase().includes(term)
  );

  return (
    <div className="grid gap-4">
      <TableShell
        filters={
          <>
            <div className="relative min-w-48 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                className="pl-9"
                placeholder="Buscar sección por nombre, código o tipo..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Buscar sección"
              />
            </div>
            {query.data ? (
              <span className="text-xs text-muted-foreground">
                {query.data.total} sección{query.data.total !== 1 ? "es" : ""} en «{query.data.pageInfo.title}»
              </span>
            ) : null}
            <Button size="sm" onClick={() => setCreating(true)} disabled={!query.data?.pageInfo.id}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nueva sección
            </Button>
          </>
        }
        footer={
          query.data ? (
            <PaginationBar
              page={query.data.page}
              totalPages={query.data.totalPages}
              loading={query.isFetching}
              onPrevious={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => Math.min(query.data.totalPages, current + 1))}
              onGoTo={(target) => setPage(target)}
            />
          ) : undefined
        }
      >
        {query.isLoading ? <DataTableSkeleton columns={4} rows={6} /> : null}
        {query.isError ? (
          <ErrorState
            title="No se pudo cargar el contenido público"
            description={humanizeApiError(query.error)}
            actionLabel="Reintentar"
            onAction={() => void query.refetch()}
          />
        ) : null}
        {query.data ? (
          <DataTable<PublicContentRow>
            data={rows}
            getRowKey={(row) => row.id}
            columns={[
              {
                key: "name",
                header: "Sección",
                render: (row) => (
                  <div>
                    <p className="font-semibold">{row.name}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{contentPreview(row)}</p>
                  </div>
                )
              },
              { key: "page", header: "Página", render: (row) => row.pageLabel },
              { key: "type", header: "Tipo", render: (row) => <Badge variant="secondary">{row.type}</Badge> },
              {
                key: "status",
                header: "Estado",
                render: (row) => (
                  <Badge variant={row.status === "activo" ? "success" : row.status === "pendiente" ? "warning" : "muted"}>{row.status}</Badge>
                )
              },
              {
                key: "actions",
                header: "Acciones",
                render: (row) => (
                  <div className="flex flex-wrap gap-2">
                    <Button size="icon" variant="outline" title="Ver contenido" aria-label={`Ver ${row.name}`} onClick={() => setPreview(row)}>
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button size="icon" variant="outline" title="Editar" aria-label={`Editar ${row.name}`} onClick={() => setEditing(row)}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      title="Eliminar"
                      aria-label={`Eliminar ${row.name}`}
                      disabled={deleteMutation.isPending}
                      onClick={() => void onDelete(row)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                )
              }
            ]}
          />
        ) : null}
      </TableShell>

      <SectionPreviewModal row={preview} onClose={() => setPreview(null)} />

      {editing ? (
        <SectionEditorModal
          open
          row={editing}
          pending={updateMutation.isPending}
          errorMessage={updateMutation.isError ? humanizeApiError(updateMutation.error) : undefined}
          onClose={() => setEditing(null)}
          onSubmit={(input) => updateMutation.mutate({ row: editing, input })}
        />
      ) : null}

      {creating ? (
        <SectionEditorModal
          open
          pending={createMutation.isPending}
          errorMessage={createMutation.isError ? humanizeApiError(createMutation.error) : undefined}
          onClose={() => setCreating(false)}
          onSubmit={(input) => createMutation.mutate(input)}
        />
      ) : null}
    </div>
  );
}

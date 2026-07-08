"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  createApproach,
  createService,
  listApproaches,
  listServices,
  updateApproach,
  updateService,
  type CatalogRow
} from "@/features/products/products.api";
import { humanizeApiError } from "@/shared/api/errors";
import { getString } from "@/shared/api/normalizers";
import { uploadFile } from "@/shared/api/files";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable, PaginationBar } from "@/shared/ui/data-table";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { ErrorState, LoadingState } from "@/shared/ui/state";

const PAGE_SIZE = 20;

type CatalogKind = "approaches" | "services";

const catalogLoaders = {
  approaches: listApproaches,
  services: listServices
} satisfies Record<CatalogKind, typeof listApproaches>;

const catalogLabels: Record<CatalogKind, { singular: string; create: string }> = {
  approaches: { singular: "enfoque", create: "Crear enfoque" },
  services: { singular: "servicio", create: "Crear servicio" }
};

function CatalogForm({
  kind,
  editing,
  onDone,
  approaches
}: {
  kind: CatalogKind;
  editing: CatalogRow | null;
  onDone: () => void;
  approaches: CatalogRow[];
}) {
  const queryClient = useQueryClient();
  const raw = editing?.raw ?? {};

  const mutation = useMutation({
    mutationFn: async (form: FormData) => {
      const status = String(form.get("status") ?? "ACTIVE") as "ACTIVE" | "INACTIVE";
      const name = String(form.get("name") ?? "");
      const description = String(form.get("description") ?? "") || undefined;
      const sortOrderRaw = String(form.get("sortOrder") ?? "").trim();
      const sortOrder = sortOrderRaw ? Number(sortOrderRaw) : undefined;
      const file = form.get("imageFile");
      let imageFileId = String(form.get("imageFileId") ?? "").trim() || editing?.imageFileId || getString(raw, ["imageFileId", "image_file_id"], "");

      if (file instanceof File && file.size > 0) {
        const uploaded = await uploadFile({
          file,
          module: "THERAPY_CATALOG",
          entityType: kind === "approaches" ? "THERAPY_APPROACH" : "THERAPY_PRODUCT",
          entityId: editing?.id,
          visibility: "PUBLIC"
        });
        imageFileId = uploaded.fileId ?? imageFileId;
      }

      if (kind === "approaches") {
        const input = { name, description, status, sortOrder, imageFileId: imageFileId || undefined };
        return editing ? updateApproach(editing.id, input) : createApproach(input);
      }

      const input = {
        approachId: String(form.get("approachId") ?? ""),
        name,
        description,
        durationMinutes: Number(form.get("durationMinutes") ?? 0),
        price: Number(form.get("price") ?? 0),
        currency: String(form.get("currency") ?? "BOB"),
        status,
        sortOrder,
        imageFileId: imageFileId || undefined
      };
      return editing ? updateService(editing.id, input) : createService(input);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["catalog", kind] });
      onDone();
    }
  });

  return (
    <form
      className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate(new FormData(event.currentTarget));
      }}
    >
      <div className="md:col-span-2">
        <h2 className="text-lg font-bold">{editing ? `Editar ${catalogLabels[kind].singular}` : catalogLabels[kind].create}</h2>
      </div>
      <div className="grid gap-2">
        <Label>Nombre</Label>
        <Input name="name" required defaultValue={getString(raw, ["name", "nombre"], "")} />
      </div>
      <div className="grid gap-2">
        <Label>Estado</Label>
        <select
          name="status"
          className="focus-ring h-14 w-full rounded-[14px] border border-slate-500/80 bg-[#fbfaf8] px-4 py-3 text-sm shadow-sm hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          defaultValue={getString(raw, ["status", "estado"], "ACTIVE").toUpperCase() === "INACTIVE" ? "INACTIVE" : "ACTIVE"}
        >
          <option value="ACTIVE">Activo</option>
          <option value="INACTIVE">Inactivo</option>
        </select>
      </div>
      <div className="grid gap-2 md:col-span-2">
        <Label>Descripción</Label>
        <Textarea name="description" defaultValue={getString(raw, ["description", "descripcion"], "")} />
      </div>
      <div className="grid gap-2">
        <Label>Orden</Label>
        <Input name="sortOrder" type="number" min={0} defaultValue={getString(raw, ["sortOrder", "sort_order", "orden"], "")} />
      </div>
      <div className="grid gap-2 md:col-span-2">
        <Label>Imagen</Label>
        {editing?.imageUrl ? <img src={editing.imageUrl} alt={editing.name} className="h-28 w-full rounded-2xl border object-cover" /> : null}
        <Input name="imageFile" type="file" accept="image/png,image/jpeg,image/webp" />
        <input type="hidden" name="imageFileId" value={editing?.imageFileId ?? getString(raw, ["imageFileId", "image_file_id"], "")} readOnly />
        <p className="text-xs text-muted-foreground">La imagen se sube al servidor y queda vinculada al enfoque o servicio mediante GCS/local storage.</p>
      </div>
      {kind === "services" ? (
        <>
          <div className="grid gap-2">
            <Label>Enfoque asociado</Label>
            <select
              name="approachId"
              required
              className="focus-ring h-14 w-full rounded-[14px] border border-slate-500/80 bg-[#fbfaf8] px-4 py-3 text-sm shadow-sm hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              defaultValue={getString(raw, ["approachId", "approach_id"], "")}
            >
              <option value="">Seleccionar enfoque</option>
              {approaches.map((approach) => (
                <option key={approach.id} value={approach.id}>{approach.name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label>Duración (minutos)</Label>
            <Input name="durationMinutes" type="number" min={15} max={240} required defaultValue={getString(raw, ["durationMinutes", "duration_minutes"], "60")} />
          </div>
          <div className="grid gap-2">
            <Label>Precio</Label>
            <Input name="price" type="number" min={0} step="0.01" required defaultValue={getString(raw, ["price", "precio"], "")} />
          </div>
          <div className="grid gap-2">
            <Label>Moneda</Label>
            <Input name="currency" defaultValue={getString(raw, ["currency", "moneda"], "BOB")} />
          </div>
        </>
      ) : null}
      {mutation.isError ? <p className="text-sm text-destructive md:col-span-2">{humanizeApiError(mutation.error)}</p> : null}
      <div className="flex gap-3 md:col-span-2">
        <Button disabled={mutation.isPending} type="submit">
          {mutation.isPending ? "Guardando..." : editing ? "Guardar cambios" : "Crear"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function CatalogTable({ kind }: { kind: CatalogKind }) {
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<CatalogRow | null>(null);

  const query = useQuery({ queryKey: ["catalog", kind, { page, pageSize: PAGE_SIZE }], queryFn: () => catalogLoaders[kind]({ page, pageSize: PAGE_SIZE }) });
  const approachesQuery = useQuery({
    queryKey: ["catalog", "approaches", "all-for-select"],
    queryFn: () => listApproaches({ page: 1, pageSize: 100 }),
    enabled: kind === "services"
  });

  const closeForm = () => {
    setFormOpen(false);
    setEditingRow(null);
  };

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        {!formOpen ? (
          <Button onClick={() => { setEditingRow(null); setFormOpen(true); }}>{catalogLabels[kind].create}</Button>
        ) : null}
      </div>

      {formOpen ? (
        <CatalogForm kind={kind} editing={editingRow} onDone={closeForm} approaches={approachesQuery.data?.items ?? []} />
      ) : null}

      {query.isLoading ? <LoadingState title="Consultando catálogo" /> : null}
      {query.isError ? <ErrorState title="No se pudo cargar el catálogo" description={humanizeApiError(query.error)} actionLabel="Reintentar" onAction={() => void query.refetch()} /> : null}
      {query.data ? (
        <>
          <DataTable<CatalogRow>
            data={query.data.items}
            getRowKey={(row) => row.id}
            columns={[
              { key: "image", header: "Imagen", render: (row) => row.imageUrl ? <img src={row.imageUrl} alt={row.name} className="h-12 w-16 rounded-xl border object-cover" /> : <span className="text-xs text-muted-foreground">Sin imagen</span> },
              { key: "name", header: "Nombre", render: (row) => <span className="font-semibold">{row.name}</span> },
              { key: "type", header: "Tipo", render: (row) => row.type },
              { key: "status", header: "Estado", render: (row) => <Badge variant={row.status === "activo" ? "success" : row.status === "pendiente" ? "warning" : "muted"}>{row.status}</Badge> },
              {
                key: "actions",
                header: "Acciones",
                render: (row) => (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingRow(row);
                      setFormOpen(true);
                    }}
                  >
                    Editar
                  </Button>
                )
              }
            ]}
          />
          <PaginationBar page={query.data.page} totalPages={query.data.totalPages} onPrevious={() => setPage((current) => Math.max(1, current - 1))} onNext={() => setPage((current) => Math.min(query.data.totalPages, current + 1))} />
        </>
      ) : null}
    </div>
  );
}

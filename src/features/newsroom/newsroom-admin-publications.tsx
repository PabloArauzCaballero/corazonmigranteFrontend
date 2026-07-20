"use client";

import { type ChangeEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Archive, Home, Pencil, Plus, Send, X } from "lucide-react";
import { newsroomApi } from "@/features/newsroom/newsroom.api";
import { listCmsPages } from "@/features/editorial/editorial.api";
import type { Publication, PublicationType } from "@/features/newsroom/newsroom.types";
import { Field, fmtDate, fstr, isoLocal, NativeInput, NativeTextarea, Notice, Panel, Select, StatusBadge, Submit, TagPicker, toDatetimeLocal, typeLabel, useNotice } from "@/features/newsroom/admin-kit";
import { humanizeApiError } from "@/shared/api/errors";
import { Button } from "@/shared/ui/button";
import { DataTable, PaginationBar } from "@/shared/ui/data-table";
import { ErrorState, LoadingState } from "@/shared/ui/state";

const TYPES: PublicationType[] = ["NEWS", "COLUMN", "OPINION", "INTERVIEW", "REPORT", "ANALYSIS"];
const PAGE_SIZE = 12;

function publicationPageLabels(row: Publication) {
  const metadata = row.seoMetadata && typeof row.seoMetadata === "object" ? row.seoMetadata : {};
  const pages = Array.isArray(metadata.embedPages) ? metadata.embedPages : [];
  const labels = pages
    .map((page) => typeof page === "object" && page !== null ? String((page as { title?: unknown; slug?: unknown }).title ?? (page as { slug?: unknown }).slug ?? "").trim() : "")
    .filter(Boolean);
  if (labels.length) return labels.join(", ");
  const slugs = Array.isArray(metadata.embedPageSlugs) ? metadata.embedPageSlugs.map((slug) => String(slug).trim()).filter(Boolean) : [];
  return slugs.length ? slugs.map((slug) => `/${slug}`).join(", ") : "Global";
}

function PublicationActions({ row, onDone, onEdit }: { row: Publication; onDone: () => void; onEdit: (row: Publication) => void }) {
  const [error, setError] = useState("");
  const publish = useMutation({ mutationFn: () => newsroomApi.publish(row.id), onSuccess: onDone, onError: (e) => setError(humanizeApiError(e)) });
  const archive = useMutation({ mutationFn: () => newsroomApi.archive(row.id), onSuccess: onDone, onError: (e) => setError(humanizeApiError(e)) });
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" asChild variant="outline"><Link href={{ pathname: "/novedades/detalle", query: { slug: row.slug } }}>Ver</Link></Button>
        <Button size="sm" variant="outline" onClick={() => onEdit(row)}><Pencil className="h-4 w-4" />Editar</Button>
        <Button size="sm" disabled={publish.isPending || row.status === "PUBLISHED"} onClick={() => publish.mutate()}><Send className="h-4 w-4" />Publicar</Button>
        <Button size="sm" variant="outline" disabled={archive.isPending || row.status === "ARCHIVED"} onClick={() => archive.mutate()}><Archive className="h-4 w-4" />Archivar</Button>
      </div>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

function PublicationsForm({ editing, onDone, onCancel }: { editing?: Publication | null; onDone: () => void; onCancel?: () => void }) {
  const notice = useNotice();
  const authors = useQuery({ queryKey: ["newsroom-authors"], queryFn: () => newsroomApi.authors() });
  const categories = useQuery({ queryKey: ["newsroom-categories"], queryFn: () => newsroomApi.categories() });
  const tags = useQuery({ queryKey: ["newsroom-tags"], queryFn: () => newsroomApi.tags() });
  const pages = useQuery({ queryKey: ["publication-embed-pages"], queryFn: listCmsPages, retry: false });
  const embedPagesFromMetadata = Array.isArray(editing?.seoMetadata?.embedPageSlugs) ? (editing?.seoMetadata?.embedPageSlugs as unknown[]).map((slug) => String(slug)) : [];
  const [tagIds, setTagIds] = useState<string[]>(editing?.tags.map((t) => t.id) ?? []);
  const [embedPageSlugs, setEmbedPageSlugs] = useState<string[]>(embedPagesFromMetadata);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const mutation = useMutation({
    mutationFn: async (form: FormData) => {
      notice.clear();
      const payload = {
        authorId: fstr(form, "authorId"),
        categoryId: fstr(form, "categoryId"),
        title: fstr(form, "title"),
        slug: fstr(form, "slug") || undefined,
        summary: fstr(form, "summary"),
        body: fstr(form, "body"),
        publicationType: fstr(form, "publicationType") as PublicationType,
        accessType: fstr(form, "accessType"),
        scheduledAt: isoLocal(fstr(form, "scheduledAt")),
        tagIds,
        commentsEnabled,
        reactionsEnabled,
        seoMetadata: {
          description: fstr(form, "seoDescription") || fstr(form, "summary"),
          embedPageSlugs,
          embedPages: (pages.data ?? [])
            .filter((page) => embedPageSlugs.includes(page.slug))
            .map((page) => ({ id: page.id, slug: page.slug, title: page.title }))
        }
      };
      if (editing) return newsroomApi.updatePublication(editing.id, payload);
      return newsroomApi.createPublication(payload);
    },
    onSuccess: () => {
      notice.ok(editing ? "Publicación actualizada." : "Publicación creada. Queda en borrador o programada según el formulario.");
      if (!editing) { setTagIds([]); setEmbedPageSlugs([]); }
      onDone();
    },
    onError: notice.fail
  });

  return (
    <Panel
      title={editing ? `Editar publicación: ${editing.title}` : "Crear publicación"}
      description="Formulario editorial adaptado al estilo de Corazón Migrante."
      icon={editing ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
    >
      <form className="grid gap-4 xl:grid-cols-3" onSubmit={(e) => { e.preventDefault(); mutation.mutate(new FormData(e.currentTarget)); }}>
        <Field label="Título" className="xl:col-span-2"><NativeInput name="title" required minLength={4} defaultValue={editing?.title ?? ""} /></Field>
        <Field label="Slug opcional"><NativeInput name="slug" defaultValue={editing?.slug ?? ""} /></Field>
        <Field label="Autor"><Select name="authorId" required defaultValue={editing?.author?.id ?? ""}><option value="" disabled>{authors.isLoading ? "Cargando..." : "Seleccionar"}</option>{(authors.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.displayName}</option>)}</Select></Field>
        <Field label="Categoría"><Select name="categoryId" required defaultValue={editing?.category?.id ?? ""}><option value="" disabled>{categories.isLoading ? "Cargando..." : "Seleccionar"}</option>{(categories.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Tipo dentro de Contenido Público"><Select name="publicationType" defaultValue={editing?.publicationType ?? "NEWS"}>{TYPES.map((type) => <option key={type} value={type}>{typeLabel(type)}</option>)}</Select></Field>
        <Field label="Acceso"><Select name="accessType" defaultValue={editing?.accessType ?? "PUBLIC"}><option value="PUBLIC">Público</option><option value="PREMIUM">Premium</option><option value="INTERNAL_ONLY">Interno</option></Select></Field>
        <Field label="Programar"><NativeInput name="scheduledAt" type="datetime-local" defaultValue={toDatetimeLocal(editing?.scheduledAt)} /></Field>
        <Field label="Tags" className="xl:col-span-2" hint="Busca por nombre y haz clic para agregar; haz clic en la X para quitar.">
          <TagPicker options={(tags.data ?? []).map((t) => ({ id: t.id, name: t.name }))} value={tagIds} onChange={setTagIds} loading={tags.isLoading} />
        </Field>
        <Field label="Páginas donde aparecerá" className="xl:col-span-3" hint="Sirve para controlar dónde se incrustará esta publicación.">
          <Select multiple className="min-h-32" value={embedPageSlugs} onChange={(event: ChangeEvent<HTMLSelectElement>) => setEmbedPageSlugs(Array.from(event.currentTarget.selectedOptions).map((option) => option.value))}>
            {(pages.data ?? []).map((page) => <option key={page.id || page.slug} value={page.slug}>{page.title} · /{page.slug}</option>)}
          </Select>
          {pages.isLoading ? <p className="text-xs text-muted-foreground">Cargando páginas públicas...</p> : null}
          {pages.isError ? <p className="text-xs text-red-700">No se pudieron cargar las páginas públicas.</p> : null}
        </Field>
        <Field label="Resumen" className="xl:col-span-3"><NativeTextarea name="summary" required minLength={10} className="min-h-24" defaultValue={editing?.summary ?? ""} /></Field>
        <Field label="Cuerpo" className="xl:col-span-3"><NativeTextarea name="body" required minLength={20} className="min-h-64" defaultValue={editing?.body ?? ""} /></Field>
        <Field label="Descripción SEO" className="xl:col-span-2"><NativeInput name="seoDescription" defaultValue={typeof editing?.seoMetadata?.description === "string" ? editing.seoMetadata.description : ""} /></Field>
        <div className="flex items-center gap-6 xl:col-span-3">
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={commentsEnabled} onChange={(e) => setCommentsEnabled(e.target.checked)} className="h-4 w-4 rounded border" />Permitir comentarios</label>
          <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={reactionsEnabled} onChange={(e) => setReactionsEnabled(e.target.checked)} className="h-4 w-4 rounded border" />Permitir reacciones</label>
        </div>
        <div className="flex items-center gap-3 xl:col-span-3">
          <Submit pending={mutation.isPending} label={editing ? "Guardar cambios" : "Crear publicación"} />
          {editing ? <Button type="button" variant="outline" onClick={onCancel}><X className="h-4 w-4" />Cancelar edición</Button> : null}
        </div>
        <div className="xl:col-span-3"><Notice message={notice.message} error={notice.error} /></div>
      </form>
    </Panel>
  );
}

export function PublicationsAdmin() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [editing, setEditing] = useState<Publication | null>(null);
  const query = useQuery({ queryKey: ["newsroom-publications", page, type], queryFn: () => newsroomApi.listPublications({ page, pageSize: PAGE_SIZE, publicationType: type as PublicationType | "", sort: "createdAt", order: "desc" }) });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["newsroom-publications"] });

  return (
    <div className="grid gap-6">
      <PublicationsForm key={editing?.id ?? "new"} editing={editing} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); refresh(); }} />
      <Panel title="Publicaciones" description="Contenido editorial que se publica dentro de Contenido Público." icon={<Send className="h-5 w-5" />}>
        <div className="mb-5 max-w-xs">
          <Field label="Sección"><Select value={type} onChange={(e) => setType(e.target.value)}><option value="">Todos</option>{TYPES.map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}</Select></Field>
        </div>
        {query.isLoading ? <LoadingState title="Cargando publicaciones" /> : null}
        {query.isError ? <ErrorState title="No se pudo cargar publicaciones" description={humanizeApiError(query.error)} actionLabel="Reintentar" onAction={() => void query.refetch()} /> : null}
        {query.data ? (
          <div className="grid gap-4">
            <DataTable<Publication>
              data={query.data.items}
              getRowKey={(r) => r.id}
              columns={[
                { key: "title", header: "Publicación", render: (r) => <div><p className="font-semibold">{r.title}</p><p className="line-clamp-2 text-xs text-muted-foreground">{r.summary}</p></div> },
                { key: "type", header: "Sección", render: (r) => typeLabel(r.publicationType) },
                { key: "category", header: "Categoría", render: (r) => r.category?.name ?? "—" },
                { key: "pages", header: "Páginas", render: (r) => publicationPageLabels(r) },
                { key: "status", header: "Estado", render: (r) => <StatusBadge status={r.status} /> },
                { key: "date", header: "Fecha", render: (r) => fmtDate(r.publishedAt ?? r.scheduledAt) },
                { key: "actions", header: "Acciones", render: (r) => <PublicationActions row={r} onDone={refresh} onEdit={setEditing} /> }
              ]}
            />
            <PaginationBar page={query.data.page} totalPages={query.data.totalPages} onPrevious={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => Math.min(query.data?.totalPages ?? p, p + 1))} />
          </div>
        ) : null}
      </Panel>
    </div>
  );
}

export function HomepageAdmin() {
  const preview = useQuery({ queryKey: ["homepage-preview"], queryFn: () => newsroomApi.homepagePreview() });
  return (
    <Panel title="Portada editorial" description="Validación de titulares, columnas y layout desde el sistema unificado." icon={<Home className="h-5 w-5" />}>
      {preview.isLoading ? <LoadingState title="Cargando portada" /> : null}
      {preview.isError ? <ErrorState title="No se pudo cargar portada" description={humanizeApiError(preview.error)} /> : null}
      {preview.data ? (
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border p-5"><p className="text-sm text-muted-foreground">Titulares</p><p className="text-3xl font-bold">{preview.data.editorial?.headlines?.length ?? 0}</p></div>
            <div className="rounded-2xl border p-5"><p className="text-sm text-muted-foreground">Columnas</p><p className="text-3xl font-bold">{preview.data.editorial?.columns?.length ?? 0}</p></div>
            <div className="rounded-2xl border p-5"><p className="text-sm text-muted-foreground">Layout</p><p className="text-3xl font-bold">{preview.data.layout?.length ?? 0}</p></div>
          </div>
          <DataTable<Publication>
            data={[...(preview.data.editorial?.headlines ?? []), ...(preview.data.editorial?.columns ?? [])]}
            getRowKey={(r) => r.id}
            columns={[
              { key: "title", header: "Publicación", render: (r) => <b>{r.title}</b> },
              { key: "type", header: "Sección", render: (r) => typeLabel(r.publicationType) },
              { key: "status", header: "Estado", render: (r) => <StatusBadge status={r.status} /> },
              { key: "link", header: "Vista", render: (r) => <Button asChild size="sm" variant="outline"><Link href={{ pathname: "/novedades/detalle", query: { slug: r.slug } }}>Abrir</Link></Button> }
            ]}
          />
        </div>
      ) : null}
    </Panel>
  );
}

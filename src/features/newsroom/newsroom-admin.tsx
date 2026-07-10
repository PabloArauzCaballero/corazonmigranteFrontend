"use client";

import { type ChangeEvent, type FormEvent, type ReactNode, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Archive, CheckCircle2, Clock3, Home, Megaphone, Newspaper, Pencil, Plus, Send, Tags, UserRoundPlus, Users, X, XCircle } from "lucide-react";
import { adsApi, newsroomApi } from "@/features/newsroom/newsroom.api";
import { listCmsPages } from "@/features/editorial/editorial.api";
import { listPatients, listUsers } from "@/features/users/users.api";
import type { AdsCampaign, AdsCompany, AdsCreative, AdsPlacement, Author, Category, ContentSubscriber, Publication, PublicationType, Tag } from "@/features/newsroom/newsroom.types";
import type { AdminUser } from "@/features/users/users.types";
import { csv, Field, fmtDate, fnum, fstr, isoLocal, NativeInput, NativeTextarea, Notice, paginateClient, Panel, Select, StatusBadge, Submit, TagPicker, typeLabel } from "@/features/newsroom/admin-kit";
import { ApiError, humanizeApiError } from "@/shared/api/errors";
import { uploadFile } from "@/shared/api/files";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable, PaginationBar } from "@/shared/ui/data-table";
import { ErrorState, LoadingState } from "@/shared/ui/state";

const TYPES: PublicationType[] = ["NEWS", "COLUMN", "OPINION", "INTERVIEW", "REPORT", "ANALYSIS"];
const PAGE_SIZE = 12;
const ADS_PAGE_SIZE = 10;

function useNotice() { const [message, setMessage] = useState(""); const [error, setError] = useState(""); return { message, error, ok: setMessage, fail: (e: unknown) => setError(humanizeApiError(e)), clear: () => { setMessage(""); setError(""); } }; }

function toDatetimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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
      if (!editing) {
        setTagIds([]);
        setEmbedPageSlugs([]);
      }
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
        <Field label="Páginas donde aparecerá" className="xl:col-span-3" hint="Se obtiene dinámicamente desde las páginas públicas configuradas. Sirve para controlar dónde se incrustará esta publicación.">
          <Select
            multiple
            className="min-h-32"
            value={embedPageSlugs}
            onChange={(event: ChangeEvent<HTMLSelectElement>) => setEmbedPageSlugs(Array.from(event.currentTarget.selectedOptions).map((option) => option.value))}
          >
            {(pages.data ?? []).map((page) => <option key={page.id || page.slug} value={page.slug}>{page.title} · /{page.slug}</option>)}
          </Select>
          {pages.isLoading ? <p className="text-xs text-muted-foreground">Cargando páginas públicas...</p> : null}
          {pages.isError ? <p className="text-xs text-red-700">No se pudieron cargar las páginas públicas; la publicación se guardará sin ubicación específica.</p> : null}
        </Field>
        <Field label="Resumen" className="xl:col-span-3"><NativeTextarea name="summary" required minLength={10} className="min-h-24" defaultValue={editing?.summary ?? ""} /></Field>
        <Field label="Cuerpo" className="xl:col-span-3"><NativeTextarea name="body" required minLength={20} className="min-h-64" defaultValue={editing?.body ?? ""} /></Field>
        <Field label="Descripción SEO" className="xl:col-span-2"><NativeInput name="seoDescription" defaultValue={typeof editing?.seoMetadata?.description === "string" ? editing.seoMetadata.description : ""} /></Field>
        <div className="flex items-center gap-6 xl:col-span-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={commentsEnabled} onChange={(e) => setCommentsEnabled(e.target.checked)} className="h-4 w-4 rounded border" />
            Permitir comentarios
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={reactionsEnabled} onChange={(e) => setReactionsEnabled(e.target.checked)} className="h-4 w-4 rounded border" />
            Permitir reacciones
          </label>
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
  return <div className="grid gap-2"><div className="flex flex-wrap gap-2"><Button size="sm" asChild variant="outline"><Link href={{ pathname: "/novedades/detalle", query: { slug: row.slug } }}>Ver</Link></Button><Button size="sm" variant="outline" onClick={() => onEdit(row)}><Pencil className="h-4 w-4" />Editar</Button><Button size="sm" disabled={publish.isPending || row.status === "PUBLISHED"} onClick={() => publish.mutate()}><Send className="h-4 w-4" />Publicar</Button><Button size="sm" variant="outline" disabled={archive.isPending || row.status === "ARCHIVED"} onClick={() => archive.mutate()}><Archive className="h-4 w-4" />Archivar</Button></div>{error ? <p className="text-xs text-red-700">{error}</p> : null}</div>;
}

export function PublicationsAdmin() {
  const qc = useQueryClient(); const [page, setPage] = useState(1); const [type, setType] = useState(""); const [editing, setEditing] = useState<Publication | null>(null);
  const query = useQuery({ queryKey: ["newsroom-publications", page, type], queryFn: () => newsroomApi.listPublications({ page, pageSize: PAGE_SIZE, publicationType: type as PublicationType | "", sort: "createdAt", order: "desc" }) });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["newsroom-publications"] });
  return <div className="grid gap-6"><PublicationsForm key={editing?.id ?? "new"} editing={editing} onCancel={() => setEditing(null)} onDone={() => { setEditing(null); refresh(); }} /><Panel title="Publicaciones" description="Contenido editorial que se publica dentro de Contenido Público." icon={<Newspaper className="h-5 w-5" />}><div className="mb-5 max-w-xs"><Field label="Sección"><Select value={type} onChange={(e) => setType(e.target.value)}><option value="">Todos</option>{TYPES.map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}</Select></Field></div>{query.isLoading ? <LoadingState title="Cargando publicaciones" /> : null}{query.isError ? <ErrorState title="No se pudo cargar publicaciones" description={humanizeApiError(query.error)} actionLabel="Reintentar" onAction={() => void query.refetch()} /> : null}{query.data ? <div className="grid gap-4"><DataTable<Publication> data={query.data.items} getRowKey={(r) => r.id} columns={[{ key: "title", header: "Publicación", render: (r) => <div><p className="font-semibold">{r.title}</p><p className="line-clamp-2 text-xs text-muted-foreground">{r.summary}</p></div> }, { key: "type", header: "Sección", render: (r) => typeLabel(r.publicationType) }, { key: "category", header: "Categoría", render: (r) => r.category?.name ?? "—" }, { key: "pages", header: "Páginas", render: (r) => publicationPageLabels(r) }, { key: "status", header: "Estado", render: (r) => <StatusBadge status={r.status} /> }, { key: "date", header: "Fecha", render: (r) => fmtDate(r.publishedAt ?? r.scheduledAt) }, { key: "actions", header: "Acciones", render: (r) => <PublicationActions row={r} onDone={refresh} onEdit={setEditing} /> }]} /><PaginationBar page={query.data.page} totalPages={query.data.totalPages} onPrevious={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => Math.min(query.data?.totalPages ?? p, p + 1))} /></div> : null}</Panel></div>;
}

export function CategoriesAdmin() { const qc = useQueryClient(); const notice = useNotice(); const query = useQuery({ queryKey: ["newsroom-categories"], queryFn: () => newsroomApi.categories() }); const mutation = useMutation({ mutationFn: async (form: FormData) => { notice.clear(); return newsroomApi.createCategory({ name: fstr(form, "name"), slug: fstr(form, "slug") || undefined, description: fstr(form, "description") || undefined, isActive: fstr(form, "isActive") === "true", sortOrder: fnum(form, "sortOrder", 0) }); }, onSuccess: () => { notice.ok("Categoría creada."); void qc.invalidateQueries({ queryKey: ["newsroom-categories"] }); }, onError: notice.fail }); return <TaxonomyShell title="Categorías editoriales" notice={notice} mutationPending={mutation.isPending} onSubmit={(e) => { e.preventDefault(); mutation.mutate(new FormData(e.currentTarget)); }}>{query.isLoading ? <LoadingState title="Cargando categorías" /> : null}{query.isError ? <ErrorState title="No se pudo cargar categorías" description={humanizeApiError(query.error)} /> : null}{query.data ? <DataTable<Category> data={query.data} getRowKey={(r) => r.id} columns={[{ key: "name", header: "Nombre", render: (r) => <b>{r.name}</b> }, { key: "slug", header: "Slug", render: (r) => r.slug }, { key: "status", header: "Estado", render: (r) => <StatusBadge status={r.isActive} /> }, { key: "id", header: "ID", render: (r) => <code className="text-xs">{r.id}</code> }]} /> : null}</TaxonomyShell>; }
function TaxonomyShell({ title, notice, mutationPending, onSubmit, children }: { title: string; notice: ReturnType<typeof useNotice>; mutationPending: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; children: ReactNode }) { return <div className="grid gap-6"><Panel title={`Crear ${title.toLowerCase()}`} icon={<Tags className="h-5 w-5" />}><form className="grid gap-4 md:grid-cols-4" onSubmit={onSubmit}><Field label="Nombre"><NativeInput name="name" required minLength={2} /></Field><Field label="Slug"><NativeInput name="slug" /></Field><Field label="Orden"><NativeInput name="sortOrder" type="number" defaultValue={0} /></Field><Field label="Estado"><Select name="isActive" defaultValue="true"><option value="true">Activo</option><option value="false">Inactivo</option></Select></Field><Field label="Descripción" className="md:col-span-4"><NativeTextarea name="description" /></Field><div className="md:col-span-4"><Submit pending={mutationPending} label="Crear" /></div><div className="md:col-span-4"><Notice message={notice.message} error={notice.error} /></div></form></Panel><Panel title={title}>{children}</Panel></div>; }
export function TagsAdmin() { const qc = useQueryClient(); const notice = useNotice(); const query = useQuery({ queryKey: ["newsroom-tags"], queryFn: () => newsroomApi.tags() }); const mutation = useMutation({ mutationFn: async (form: FormData) => { notice.clear(); return newsroomApi.createTag({ name: fstr(form, "name"), slug: fstr(form, "slug") || undefined }); }, onSuccess: () => { notice.ok("Tag creado."); void qc.invalidateQueries({ queryKey: ["newsroom-tags"] }); }, onError: notice.fail }); return <div className="grid gap-6"><Panel title="Crear tag" icon={<Tags className="h-5 w-5" />}><form className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end" onSubmit={(e) => { e.preventDefault(); mutation.mutate(new FormData(e.currentTarget)); }}><Field label="Nombre"><NativeInput name="name" required /></Field><Field label="Slug"><NativeInput name="slug" /></Field><Submit pending={mutation.isPending} label="Crear" /><div className="md:col-span-3"><Notice message={notice.message} error={notice.error} /></div></form></Panel><Panel title="Tags existentes">{query.isLoading ? <LoadingState title="Cargando tags" /> : null}{query.data ? <DataTable<Tag> data={query.data} getRowKey={(r) => r.id} columns={[{ key: "name", header: "Nombre", render: (r) => <b>{r.name}</b> }, { key: "slug", header: "Slug", render: (r) => r.slug }, { key: "id", header: "ID", render: (r) => <code className="text-xs">{r.id}</code> }]} /> : null}</Panel></div>; }
export function AuthorsAdmin() {
  const qc = useQueryClient();
  const notice = useNotice();
  const query = useQuery({ queryKey: ["newsroom-authors"], queryFn: () => newsroomApi.authors() });
  const [userSearch, setUserSearch] = useState("");
  const [userId, setUserId] = useState("");
  const users = useQuery({ queryKey: ["newsroom-author-users", userSearch], queryFn: () => listUsers({ search: userSearch, page: 1, pageSize: 8 }) });
  const selectedUser = users.data?.items.find((u) => u.id === userId);
  const mutation = useMutation({
    mutationFn: async (form: FormData) => {
      notice.clear();
      return newsroomApi.createAuthor({
        displayName: fstr(form, "displayName"),
        headline: fstr(form, "headline") || undefined,
        bio: fstr(form, "bio") || undefined,
        status: fstr(form, "status") || "ACTIVE",
        userId: userId || undefined
      });
    },
    onSuccess: () => {
      notice.ok("Autor creado.");
      setUserId("");
      setUserSearch("");
      void qc.invalidateQueries({ queryKey: ["newsroom-authors"] });
    },
    onError: notice.fail
  });
  return (
    <div className="grid gap-6">
      <Panel title="Crear autor" icon={<UserRoundPlus className="h-5 w-5" />}>
        <form className="grid gap-4 md:grid-cols-3" onSubmit={(e) => { e.preventDefault(); mutation.mutate(new FormData(e.currentTarget)); }}>
          <Field label="Nombre"><NativeInput name="displayName" required /></Field>
          <Field label="Titular"><NativeInput name="headline" /></Field>
          <Field label="Estado"><Select name="status" defaultValue="ACTIVE"><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option></Select></Field>
          <Field label="Vincular usuario" className="md:col-span-3" hint="Busca por nombre o correo para asociar el autor a una cuenta existente (opcional).">
            <div className="grid gap-2">
              <NativeInput
                value={userId ? (selectedUser?.name ?? "") : userSearch}
                onChange={(e) => { setUserId(""); setUserSearch(e.target.value); }}
                placeholder={users.isLoading ? "Cargando usuarios..." : "Buscar usuario..."}
              />
              {!userId && userSearch.trim() && users.data?.items.length ? (
                <div className="flex flex-wrap gap-2 rounded-xl border bg-card p-2">
                  {users.data.items.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className="rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
                      onClick={() => { setUserId(u.id); setUserSearch(""); }}
                    >
                      {u.name} · {u.email}
                    </button>
                  ))}
                </div>
              ) : null}
              {userId ? (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{selectedUser?.email}</Badge>
                  <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setUserId("")}>Quitar</button>
                </div>
              ) : null}
            </div>
          </Field>
          <Field label="Bio" className="md:col-span-3"><NativeTextarea name="bio" /></Field>
          <div className="md:col-span-3"><Submit pending={mutation.isPending} label="Crear autor" /></div>
          <div className="md:col-span-3"><Notice message={notice.message} error={notice.error} /></div>
        </form>
      </Panel>
      <Panel title="Autores existentes">
        {query.isLoading ? <LoadingState title="Cargando autores" /> : null}
        {query.data ? <DataTable<Author> data={query.data} getRowKey={(r) => r.id} columns={[{ key: "name", header: "Autor", render: (r) => <b>{r.displayName}</b> }, { key: "headline", header: "Titular", render: (r) => r.headline ?? "—" }, { key: "bio", header: "Bio", render: (r) => <span className="line-clamp-2">{r.bio ?? "—"}</span> }, { key: "status", header: "Estado", render: (r) => <StatusBadge status={r.status} /> }]} /> : null}
      </Panel>
    </div>
  );
}

export function SubscribersAdmin() {
  const qc = useQueryClient();
  const notice = useNotice();
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<AdminUser | null>(null);
  const query = useQuery({ queryKey: ["newsroom-subscribers"], queryFn: () => newsroomApi.subscribers({ page: 1, pageSize: 50 }) });
  const patients = useQuery({
    queryKey: ["content-subscriber-patients", patientSearch],
    queryFn: () => listPatients({ search: patientSearch, page: 1, pageSize: 10 }),
    enabled: !selectedPatient
  });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["newsroom-subscribers"] });
  const mutation = useMutation({
    mutationFn: async (form: FormData) => {
      notice.clear();
      if (!selectedPatient) throw new Error("Selecciona primero un usuario paciente.");
      return newsroomApi.upsertSubscriber({
        userId: selectedPatient.id,
        email: selectedPatient.email,
        displayName: selectedPatient.name,
        status: fstr(form, "status") || "ACTIVE",
        subscriptionTier: fstr(form, "subscriptionTier") || "FREE",
        premiumUntil: isoLocal(fstr(form, "premiumUntil")),
        source: "admin"
      });
    },
    onSuccess: () => { notice.ok("Paciente suscriptor guardado."); setSelectedPatient(null); setPatientSearch(""); refresh(); },
    onError: notice.fail
  });
  const toggleTier = useMutation({
    mutationFn: (subscriber: ContentSubscriber) => newsroomApi.updateSubscriberByUser(subscriber.userId ?? subscriber.id, {
      subscriptionTier: subscriber.subscriptionTier === "PREMIUM" ? "FREE" : "PREMIUM",
      status: "ACTIVE",
      source: "admin"
    }),
    onSuccess: refresh,
    onError: notice.fail
  });
  const approveRequest = useMutation({
    mutationFn: (subscriber: ContentSubscriber) => newsroomApi.approveSubscriberRequest(subscriber.userId ?? subscriber.id),
    onSuccess: refresh,
    onError: notice.fail
  });
  const rejectRequest = useMutation({
    mutationFn: (subscriber: ContentSubscriber) => newsroomApi.rejectSubscriberRequest(subscriber.userId ?? subscriber.id),
    onSuccess: refresh,
    onError: notice.fail
  });
  const pendingRequests = (query.data?.items ?? []).filter((subscriber) => subscriber.status === "PENDING");
  return (
    <div className="grid gap-6">
      {pendingRequests.length > 0 ? (
        <Panel
          title="Solicitudes de suscripción premium"
          description="Estos pacientes pidieron acceso al contenido premium. Revisa y aprueba o rechaza cada solicitud."
          icon={<Clock3 className="h-5 w-5" />}
        >
          <DataTable<ContentSubscriber>
            data={pendingRequests}
            getRowKey={(r) => r.id}
            columns={[
              { key: "email", header: "Paciente", render: (r) => <div><b>{r.displayName || r.email}</b>{r.displayName ? <p className="text-xs text-muted-foreground">{r.email}</p> : null}</div> },
              { key: "requestedAt", header: "Solicitado", render: (r) => fmtDate((r.metadata?.requestedPremiumAt as string) ?? r.updatedAt) },
              {
                key: "actions",
                header: "Acciones",
                render: (r) => (
                  <div className="flex gap-2">
                    <Button size="sm" disabled={approveRequest.isPending} onClick={() => approveRequest.mutate(r)}>
                      <CheckCircle2 className="h-4 w-4" /> Aprobar
                    </Button>
                    <Button size="sm" variant="outline" disabled={rejectRequest.isPending} onClick={() => rejectRequest.mutate(r)}>
                      <XCircle className="h-4 w-4" /> Rechazar
                    </Button>
                  </div>
                )
              }
            ]}
          />
        </Panel>
      ) : null}
      <Panel title="Registrar paciente suscriptor" description="Los suscriptores premium se vinculan a usuarios pacientes existentes para evitar correos sueltos sin cuenta." icon={<Users className="h-5 w-5" />}>
        <form className="grid gap-4 md:grid-cols-3" onSubmit={(e) => { e.preventDefault(); mutation.mutate(new FormData(e.currentTarget)); }}>
          <Field label="Paciente" className="md:col-span-3" hint="Busca por correo o nombre y selecciona la cuenta paciente.">
            <div className="grid gap-2">
              <NativeInput
                value={selectedPatient ? `${selectedPatient.name} · ${selectedPatient.email}` : patientSearch}
                onChange={(e) => { setSelectedPatient(null); setPatientSearch(e.target.value); }}
                placeholder={patients.isLoading ? "Cargando pacientes..." : "Buscar paciente..."}
              />
              {!selectedPatient && patientSearch.trim() && patients.data?.items.length ? (
                <div className="flex flex-wrap gap-2 rounded-xl border bg-card p-2">
                  {patients.data.items.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      className="rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
                      onClick={() => { setSelectedPatient(patient); setPatientSearch(""); }}
                    >
                      {patient.name} · {patient.email}
                    </button>
                  ))}
                </div>
              ) : null}
              {selectedPatient ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">Paciente seleccionado: {selectedPatient.email}</Badge>
                  <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setSelectedPatient(null)}>Cambiar</button>
                </div>
              ) : null}
            </div>
          </Field>
          <Field label="Nivel"><Select name="subscriptionTier" defaultValue="FREE"><option value="FREE">Gratuito</option><option value="PREMIUM">Premium</option></Select></Field>
          <Field label="Estado"><Select name="status" defaultValue="ACTIVE"><option value="ACTIVE">Activo</option><option value="UNSUBSCRIBED">Desuscrito</option><option value="SUSPENDED">Suspendido</option></Select></Field>
          <Field label="Premium hasta" hint="Solo aplica si el nivel es premium."><NativeInput name="premiumUntil" type="datetime-local" /></Field>
          <div className="flex items-end md:col-span-3"><Submit pending={mutation.isPending} label="Guardar paciente suscriptor" /></div>
          <div className="md:col-span-3"><Notice message={notice.message} error={notice.error} /></div>
        </form>
      </Panel>
      <Panel title="Pacientes suscritos">
        {query.isLoading ? <LoadingState title="Cargando suscriptores" /> : null}
        {query.isError ? <ErrorState title="No se pudo cargar suscriptores" description={humanizeApiError(query.error)} actionLabel="Reintentar" onAction={() => void query.refetch()} /> : null}
        {query.data ? (
          <DataTable<ContentSubscriber>
            data={query.data.items}
            getRowKey={(r) => r.id}
            columns={[
              { key: "email", header: "Paciente", render: (r) => <div><b>{r.displayName || r.email}</b>{r.displayName ? <p className="text-xs text-muted-foreground">{r.email}</p> : null}</div> },
              { key: "tier", header: "Nivel", render: (r) => <Badge variant={r.subscriptionTier === "PREMIUM" ? "success" : "muted"}>{r.subscriptionTier}</Badge> },
              { key: "status", header: "Estado", render: (r) => <StatusBadge status={r.status} /> },
              { key: "premiumUntil", header: "Premium hasta", render: (r) => fmtDate(r.premiumUntil) },
              { key: "actions", header: "Acciones", render: (r) => <Button size="sm" variant="outline" disabled={toggleTier.isPending} onClick={() => toggleTier.mutate(r)}>{r.subscriptionTier === "PREMIUM" ? "Quitar premium" : "Hacer premium"}</Button> }
            ]}
          />
        ) : null}
      </Panel>
    </div>
  );
}

function useAdsUpload() {
  return async ({ form, key, entityType, entityId }: { form: FormData; key: string; entityType: string; entityId: string }) => {
    const file = form.get(key);
    if (!(file instanceof File) || file.size <= 0) return null;
    return uploadFile({ file, module: "CMS", entityType, entityId, visibility: "PUBLIC", admin: true });
  };
}

const adsSelectedValues = (form: FormData, key: string) => form.getAll(key).map((value) => (typeof value === "string" ? value.trim() : "")).filter(Boolean);

export function AdsCompaniesAdmin() {
  const qc = useQueryClient();
  const notice = useNotice();
  const [companiesPage, setCompaniesPage] = useState(1);
  const companies = useQuery({ queryKey: ["ads-companies"], queryFn: () => adsApi.companies() });
  const upload = useAdsUpload();

  const companyMutation = useMutation({
    mutationFn: async (form: FormData) => {
      notice.clear();
      const company = await adsApi.createCompany({
        businessName: fstr(form, "businessName"),
        commercialName: fstr(form, "commercialName"),
        contactEmail: fstr(form, "contactEmail") || undefined,
        contactPhone: fstr(form, "contactPhone") || undefined,
        status: "ACTIVE"
      });
      const uploaded = await upload({ form, key: "logoFile", entityType: "AdsCompanyLogo", entityId: company.id });
      if (!uploaded) return company;
      const metadata: Record<string, unknown> = { ...(company.metadata ?? {}) };
      if (uploaded.fileId) metadata.logoFileId = uploaded.fileId;
      if (uploaded.url) metadata.logoUrl = uploaded.url;
      return adsApi.updateCompany(company.id, { metadata });
    },
    onSuccess: () => {
      notice.ok("Empresa registrada.");
      void qc.invalidateQueries({ queryKey: ["ads-companies"] });
    },
    onError: notice.fail
  });

  const companiesPaged = paginateClient(companies.data ?? [], companiesPage, ADS_PAGE_SIZE);

  return (
    <Panel title="Empresas anunciantes" description="Registra anunciantes y consulta la lista con paginación." icon={<Megaphone className="h-5 w-5" />}>
      <div className="grid gap-6">
        <form className="grid gap-4 md:grid-cols-4" onSubmit={(e) => { e.preventDefault(); companyMutation.mutate(new FormData(e.currentTarget)); }}>
          <Field label="Razón social"><NativeInput name="businessName" required /></Field>
          <Field label="Nombre comercial"><NativeInput name="commercialName" required /></Field>
          <Field label="Email"><NativeInput name="contactEmail" type="email" /></Field>
          <Field label="Teléfono"><NativeInput name="contactPhone" /></Field>
          <Field label="Logo o banner" className="md:col-span-2" hint="Opcional. Si lo subes, queda registrado en archivos y vinculado a la empresa."><NativeInput type="file" name="logoFile" accept="image/png,image/jpeg,image/webp" /></Field>
          <div className="md:col-span-4"><Submit pending={companyMutation.isPending} label="Crear empresa" /></div>
        </form>
        <Notice message={notice.message} error={notice.error} />
        {companies.isLoading ? <LoadingState title="Cargando empresas" /> : null}
        {companies.isError ? <ErrorState title="No se pudo cargar empresas" description={humanizeApiError(companies.error)} /> : null}
        {companies.data ? (
          <div className="grid gap-4">
            <DataTable<AdsCompany>
              data={companiesPaged.rows}
              getRowKey={(row) => row.id}
              columns={[
                { key: "name", header: "Empresa", render: (row) => <div><b>{row.commercialName}</b><p className="text-xs text-muted-foreground">{row.businessName}</p></div> },
                { key: "contact", header: "Contacto", render: (row) => <span>{row.contactEmail ?? "—"}<br />{row.contactPhone ?? "—"}</span> },
                { key: "status", header: "Estado", render: (row) => <StatusBadge status={row.status} /> }
              ]}
            />
            <PaginationBar page={companiesPaged.page} totalPages={companiesPaged.totalPages} onPrevious={() => setCompaniesPage((p) => Math.max(1, p - 1))} onNext={() => setCompaniesPage((p) => Math.min(companiesPaged.totalPages, p + 1))} />
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

export function AdsPlacementsAdmin() {
  const qc = useQueryClient();
  const notice = useNotice();
  const [placementsPage, setPlacementsPage] = useState(1);
  const placements = useQuery({ queryKey: ["ads-placements"], queryFn: () => adsApi.placements() });

  const placementMutation = useMutation({
    mutationFn: async (form: FormData) => {
      notice.clear();
      return adsApi.createPlacement({
        code: fstr(form, "code"),
        name: fstr(form, "name"),
        context: fstr(form, "context") || "ARTICLE",
        description: fstr(form, "description") || undefined,
        isActive: true
      });
    },
    onSuccess: () => {
      notice.ok("Ubicación creada.");
      void qc.invalidateQueries({ queryKey: ["ads-placements"] });
    },
    onError: notice.fail
  });

  const placementsPaged = paginateClient(placements.data ?? [], placementsPage, ADS_PAGE_SIZE);

  return (
    <Panel title="Ubicaciones publicitarias" description="Espacios disponibles donde pueden mostrarse anuncios." icon={<Megaphone className="h-5 w-5" />}>
      <div className="grid gap-6">
        <form className="grid gap-4 md:grid-cols-4" onSubmit={(e) => { e.preventDefault(); placementMutation.mutate(new FormData(e.currentTarget)); }}>
          <Field label="Código"><NativeInput name="code" required placeholder="article_sidebar" /></Field>
          <Field label="Nombre"><NativeInput name="name" required /></Field>
          <Field label="Contexto"><Select name="context" defaultValue="ARTICLE"><option value="HOME">Inicio</option><option value="ARTICLE">Publicación</option><option value="CATEGORY">Categoría</option></Select></Field>
          <Field label="Descripción"><NativeInput name="description" /></Field>
          <div className="md:col-span-4"><Submit pending={placementMutation.isPending} label="Crear ubicación" /></div>
        </form>
        <Notice message={notice.message} error={notice.error} />
        {placements.isLoading ? <LoadingState title="Cargando ubicaciones" /> : null}
        {placements.isError ? <ErrorState title="No se pudo cargar ubicaciones" description={humanizeApiError(placements.error)} /> : null}
        {placements.data ? (
          <div className="grid gap-4">
            <DataTable<AdsPlacement>
              data={placementsPaged.rows}
              getRowKey={(row) => row.id}
              columns={[
                { key: "code", header: "Código", render: (row) => <code className="text-xs">{row.code}</code> },
                { key: "name", header: "Nombre", render: (row) => row.name },
                { key: "context", header: "Contexto", render: (row) => row.context },
                { key: "status", header: "Estado", render: (row) => <StatusBadge status={row.isActive} /> }
              ]}
            />
            <PaginationBar page={placementsPaged.page} totalPages={placementsPaged.totalPages} onPrevious={() => setPlacementsPage((p) => Math.max(1, p - 1))} onNext={() => setPlacementsPage((p) => Math.min(placementsPaged.totalPages, p + 1))} />
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

export function AdsCampaignsAdmin() {
  const qc = useQueryClient();
  const notice = useNotice();
  const [campaignsPage, setCampaignsPage] = useState(1);
  const companies = useQuery({ queryKey: ["ads-companies"], queryFn: () => adsApi.companies() });
  const placements = useQuery({ queryKey: ["ads-placements"], queryFn: () => adsApi.placements() });
  const campaigns = useQuery({ queryKey: ["ads-campaigns", campaignsPage], queryFn: () => adsApi.campaigns({ page: campaignsPage, pageSize: ADS_PAGE_SIZE }) });
  const publications = useQuery({ queryKey: ["ads-publications"], queryFn: () => newsroomApi.listPublications({ page: 1, pageSize: 80, status: "PUBLISHED" }) });
  const pages = useQuery({ queryKey: ["ads-public-pages"], queryFn: listCmsPages, retry: false });

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["ads-campaigns"] });
    void qc.invalidateQueries({ queryKey: ["ads-campaigns-for-creatives"] });
  };

  const campaignMutation = useMutation({
    mutationFn: async (form: FormData) => {
      notice.clear();
      const placementIds = adsSelectedValues(form, "placementIds");
      const publicationIds = adsSelectedValues(form, "publicationIds");
      const pageSlugs = adsSelectedValues(form, "pageSlugs");
      if (publicationIds.length === 0) {
        throw new ApiError("Selecciona al menos una publicación para vincular la campaña.", 400);
      }
      const startsAt = isoLocal(fstr(form, "startsAt")) ?? new Date().toISOString();
      const endsAt = isoLocal(fstr(form, "endsAt")) ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      return adsApi.createCampaign({
        companyId: fstr(form, "companyId"),
        name: fstr(form, "name"),
        objective: fstr(form, "objective") || undefined,
        startsAt,
        endsAt,
        budgetAmount: fnum(form, "budgetAmount", 0),
        currency: "BOB",
        priority: fnum(form, "priority", 100),
        placementIds: placementIds.length ? placementIds : csv(fstr(form, "placementIds")),
        publicationIds,
        pageSlugs
      });
    },
    onSuccess: () => {
      notice.ok("Campaña creada y asociada correctamente.");
      refresh();
    },
    onError: notice.fail
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adsApi.setStatus(id, status),
    onSuccess: () => {
      notice.ok("Estado actualizado.");
      refresh();
    },
    onError: notice.fail
  });

  const publicationRows = publications.data?.items ?? [];
  const pageRows = pages.data ?? [];

  return (
    <Panel title="Campañas publicitarias" description="Campañas vinculadas a publicaciones, ubicaciones y páginas públicas." icon={<Megaphone className="h-5 w-5" />}>
      <div className="grid gap-6">
        <form className="grid gap-4 xl:grid-cols-4" onSubmit={(e) => { e.preventDefault(); campaignMutation.mutate(new FormData(e.currentTarget)); }}>
          <Field label="Campaña"><NativeInput name="name" required /></Field>
          <Field label="Empresa"><Select name="companyId" required defaultValue=""><option value="" disabled>Seleccionar</option>{(companies.data ?? []).map((company) => <option key={company.id} value={company.id}>{company.commercialName}</option>)}</Select></Field>
          <Field label="Objetivo"><NativeInput name="objective" /></Field>
          <Field label="Prioridad"><NativeInput name="priority" type="number" defaultValue={100} /></Field>
          <Field label="Inicio"><NativeInput name="startsAt" type="datetime-local" required /></Field>
          <Field label="Fin"><NativeInput name="endsAt" type="datetime-local" required /></Field>
          <Field label="Presupuesto"><NativeInput name="budgetAmount" type="number" min="0" step="0.01" defaultValue={0} /></Field>
          <Field label="Ubicaciones" hint="Puedes seleccionar varias con Ctrl o Shift."><Select name="placementIds" multiple className="min-h-28">{(placements.data ?? []).map((placement) => <option key={placement.id} value={placement.id}>{placement.name} · {placement.code}</option>)}</Select></Field>
          <Field label="Publicaciones asociadas *" className="xl:col-span-2" hint="Obligatorio. Selecciona al menos una publicación a la que se vinculará la campaña (Ctrl o Shift para varias).">
            <Select name="publicationIds" multiple required className="min-h-40">
              {publicationRows.map((publication) => <option key={publication.id} value={publication.id}>{publication.title} · {typeLabel(publication.publicationType)}</option>)}
            </Select>
            {publications.isError ? <p className="text-xs text-red-700">No se pudieron cargar publicaciones publicadas: {humanizeApiError(publications.error)}</p> : null}
          </Field>
          <Field label="Páginas públicas asociadas" className="xl:col-span-2" hint="Opcional. Permite mostrar la campaña en una página pública dinámica, por ejemplo biblioteca o comunidad.">
            <Select name="pageSlugs" multiple className="min-h-40">
              {pageRows.map((page) => <option key={page.id ?? page.slug} value={page.slug}>{page.title} · /{page.slug}</option>)}
            </Select>
            {pages.isError ? <p className="text-xs text-red-700">No se pudieron cargar páginas públicas: {humanizeApiError(pages.error)}</p> : null}
          </Field>
          <div className="xl:col-span-4"><Submit pending={campaignMutation.isPending} label="Crear campaña" /></div>
        </form>
        <Notice message={notice.message} error={notice.error} />
        {campaigns.isLoading ? <LoadingState title="Cargando campañas" /> : null}
        {campaigns.isError ? <ErrorState title="No se pudo cargar campañas" description={humanizeApiError(campaigns.error)} /> : null}
        {campaigns.data ? (
          <div className="grid gap-4">
            <DataTable<AdsCampaign>
              data={campaigns.data.items}
              getRowKey={(row) => row.id}
              columns={[
                { key: "name", header: "Campaña", render: (row) => <b>{row.name}</b> },
                { key: "company", header: "Empresa", render: (row) => row.company?.commercialName ?? row.companyId },
                { key: "status", header: "Estado", render: (row) => <StatusBadge status={row.status} /> },
                { key: "target", header: "Asociación", render: (row) => { const count = row.contentTargets?.filter((target) => target.publicationId || target.categoryId || target.pageSlug).length ?? 0; return count ? `${count} publicación/categoría/página` : "Global"; } },
                { key: "dates", header: "Vigencia", render: (row) => <span>{fmtDate(row.startsAt)}<br />{fmtDate(row.endsAt)}</span> },
                { key: "actions", header: "Acciones", render: (row) => <div className="flex gap-2"><Button size="sm" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: row.id, status: "ACTIVE" })}>Activar</Button><Button size="sm" variant="outline" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: row.id, status: "PAUSED" })}>Pausar</Button></div> }
              ]}
            />
            <PaginationBar page={campaigns.data.page} totalPages={campaigns.data.totalPages} onPrevious={() => setCampaignsPage((p) => Math.max(1, p - 1))} onNext={() => setCampaignsPage((p) => Math.min(campaigns.data?.totalPages ?? p, p + 1))} />
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

export function AdsCreativesAdmin() {
  const qc = useQueryClient();
  const notice = useNotice();
  const [creativesPage, setCreativesPage] = useState(1);
  const placements = useQuery({ queryKey: ["ads-placements"], queryFn: () => adsApi.placements() });
  const campaignsForCreatives = useQuery({ queryKey: ["ads-campaigns-for-creatives"], queryFn: () => adsApi.campaigns({ page: 1, pageSize: 100 }) });
  const publications = useQuery({ queryKey: ["ads-publications"], queryFn: () => newsroomApi.listPublications({ page: 1, pageSize: 80, status: "PUBLISHED" }) });
  const pages = useQuery({ queryKey: ["ads-public-pages"], queryFn: listCmsPages, retry: false });
  const upload = useAdsUpload();

  const creativeMutation = useMutation({
    mutationFn: async (form: FormData) => {
      notice.clear();
      let assetUrl = fstr(form, "assetUrl");
      const campaignId = fstr(form, "campaignId");
      const uploaded = await upload({ form, key: "assetFile", entityType: "AdsCreative", entityId: campaignId });
      const uploadedFileId = uploaded?.fileId;
      const title = fstr(form, "title");
      if (uploaded) assetUrl = uploaded.url ?? assetUrl;
      if (!assetUrl) throw new Error("Sube una imagen o pega una URL pública para el creativo.");
      const publicationId = fstr(form, "publicationId");
      const pageSlug = fstr(form, "pageSlug");
      const placementIds = adsSelectedValues(form, "creativePlacementIds");
      return adsApi.createAd({
        campaignId,
        title,
        fileId: uploadedFileId,
        assetUrl,
        destinationUrl: fstr(form, "destinationUrl"),
        altText: fstr(form, "altText") || title || "Publicidad",
        mediaType: "IMAGE",
        mimeType: "image/webp",
        isPrimary: true,
        publicationId: publicationId || undefined,
        pageSlug: pageSlug || undefined,
        placementIds
      });
    },
    onSuccess: () => {
      notice.ok("Creativo agregado.");
      void qc.invalidateQueries({ queryKey: ["ads-campaigns-for-creatives"] });
    },
    onError: notice.fail
  });

  const publicationRows = publications.data?.items ?? [];
  const pageRows = pages.data ?? [];
  const campaignOptions = campaignsForCreatives.data?.items ?? [];
  const allCreatives = campaignOptions.flatMap((campaign) => (campaign.creatives ?? []).map((creative) => ({ ...creative, campaignName: campaign.name })));
  const creativesPaged = paginateClient(allCreatives, creativesPage, ADS_PAGE_SIZE);

  return (
    <Panel title="Creativos" description="Piezas gráficas asociadas a cada campaña." icon={<Megaphone className="h-5 w-5" />}>
      <div className="grid gap-6">
        <form className="grid gap-4 xl:grid-cols-4" onSubmit={(e) => { e.preventDefault(); creativeMutation.mutate(new FormData(e.currentTarget)); }}>
          <Field label="Campaña"><Select name="campaignId" required defaultValue=""><option value="" disabled>Seleccionar</option>{campaignOptions.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</Select></Field>
          <Field label="Título"><NativeInput name="title" required /></Field>
          <Field label="URL destino"><NativeInput name="destinationUrl" type="url" required /></Field>
          <Field label="Texto alternativo"><NativeInput name="altText" /></Field>
          <Field label="Publicación relacionada" className="xl:col-span-2" hint="Opcional. Si eliges una publicación, el anuncio queda asociado directamente a ese contenido.">
            <Select name="publicationId" defaultValue="">
              <option value="">Global / sin publicación específica</option>
              {publicationRows.map((publication) => <option key={publication.id} value={publication.id}>{publication.title} · {typeLabel(publication.publicationType)}</option>)}
            </Select>
          </Field>
          <Field label="Página pública relacionada" className="xl:col-span-2" hint="Opcional. Si eliges una página, el anuncio también queda asociado a ese slug público.">
            <Select name="pageSlug" defaultValue="">
              <option value="">Global / sin página específica</option>
              {pageRows.map((page) => <option key={page.id ?? page.slug} value={page.slug}>{page.title} · /{page.slug}</option>)}
            </Select>
          </Field>
          <Field label="Ubicaciones del anuncio" className="xl:col-span-2" hint="Opcional. Puedes seleccionar varias con Ctrl o Shift.">
            <Select name="creativePlacementIds" multiple className="min-h-28">
              {(placements.data ?? []).map((placement) => <option key={placement.id} value={placement.id}>{placement.name} · {placement.code}</option>)}
            </Select>
          </Field>
          <Field label="Imagen" className="xl:col-span-2" hint="Usa archivo o URL pública."><NativeInput type="file" name="assetFile" accept="image/png,image/jpeg,image/webp" /></Field>
          <Field label="URL imagen" className="xl:col-span-2"><NativeInput name="assetUrl" type="url" /></Field>
          <div className="xl:col-span-4"><Submit pending={creativeMutation.isPending} label="Agregar creativo" /></div>
        </form>
        <Notice message={notice.message} error={notice.error} />
        {campaignsForCreatives.isLoading ? <LoadingState title="Cargando creativos" /> : null}
        {campaignsForCreatives.isError ? <ErrorState title="No se pudo cargar creativos" description={humanizeApiError(campaignsForCreatives.error)} /> : null}
        {campaignsForCreatives.data ? (
          <div className="grid gap-4">
            <DataTable<AdsCreative & { campaignName: string }>
              data={creativesPaged.rows}
              getRowKey={(row) => row.id}
              columns={[
                { key: "title", header: "Título", render: (row) => <b>{row.title}</b> },
                { key: "campaign", header: "Campaña", render: (row) => row.campaignName },
                { key: "mediaType", header: "Tipo", render: (row) => row.mediaType },
                { key: "approval", header: "Aprobación", render: (row) => <StatusBadge status={row.approvalStatus} /> },
                { key: "primary", header: "Principal", render: (row) => (row.isPrimary ? "Sí" : "No") }
              ]}
            />
            <PaginationBar page={creativesPaged.page} totalPages={creativesPaged.totalPages} onPrevious={() => setCreativesPage((p) => Math.max(1, p - 1))} onNext={() => setCreativesPage((p) => Math.min(creativesPaged.totalPages, p + 1))} />
          </div>
        ) : null}
      </div>
    </Panel>
  );
}

export function AdvertisingAdmin() {
  return (
    <div className="grid gap-6">
      <AdsCompaniesAdmin />
      <AdsPlacementsAdmin />
      <AdsCampaignsAdmin />
      <AdsCreativesAdmin />
    </div>
  );
}

export function HomepageAdmin() { const preview = useQuery({ queryKey: ["homepage-preview"], queryFn: () => newsroomApi.homepagePreview() }); return <Panel title="Portada editorial" description="Validación de titulares, columnas y layout desde el sistema unificado." icon={<Home className="h-5 w-5" />}>{preview.isLoading ? <LoadingState title="Cargando portada" /> : null}{preview.isError ? <ErrorState title="No se pudo cargar portada" description={humanizeApiError(preview.error)} /> : null}{preview.data ? <div className="grid gap-6"><div className="grid gap-4 md:grid-cols-3"><div className="rounded-2xl border p-5"><p className="text-sm text-muted-foreground">Titulares</p><p className="text-3xl font-bold">{preview.data.editorial?.headlines?.length ?? 0}</p></div><div className="rounded-2xl border p-5"><p className="text-sm text-muted-foreground">Columnas</p><p className="text-3xl font-bold">{preview.data.editorial?.columns?.length ?? 0}</p></div><div className="rounded-2xl border p-5"><p className="text-sm text-muted-foreground">Layout</p><p className="text-3xl font-bold">{preview.data.layout?.length ?? 0}</p></div></div><DataTable<Publication> data={[...(preview.data.editorial?.headlines ?? []), ...(preview.data.editorial?.columns ?? [])]} getRowKey={(r) => r.id} columns={[{ key: "title", header: "Publicación", render: (r) => <b>{r.title}</b> }, { key: "type", header: "Sección", render: (r) => typeLabel(r.publicationType) }, { key: "status", header: "Estado", render: (r) => <StatusBadge status={r.status} /> }, { key: "link", header: "Vista", render: (r) => <Button asChild size="sm" variant="outline"><Link href={{ pathname: "/novedades/detalle", query: { slug: r.slug } }}>Abrir</Link></Button> }]} /></div> : null}</Panel>; }

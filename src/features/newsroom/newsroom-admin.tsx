"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Archive, Home, Megaphone, Newspaper, Plus, Send, Tags, UserRoundPlus, Users } from "lucide-react";
import { adsApi, newsroomApi } from "@/features/newsroom/newsroom.api";
import { listUsers } from "@/features/users/users.api";
import type { AdsCampaign, AdsCompany, AdsPlacement, Author, Category, ContentSubscriber, Publication, PublicationType, Tag } from "@/features/newsroom/newsroom.types";
import { csv, Field, fmtDate, fnum, fstr, isoLocal, NativeInput, NativeTextarea, Notice, Panel, Select, StatusBadge, Submit, TagPicker, typeLabel } from "@/features/newsroom/admin-kit";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable, PaginationBar } from "@/shared/ui/data-table";
import { ErrorState, LoadingState } from "@/shared/ui/state";

const TYPES: PublicationType[] = ["NEWS", "COLUMN", "OPINION", "INTERVIEW", "REPORT", "ANALYSIS"];
const PAGE_SIZE = 12;

function useNotice() { const [message, setMessage] = useState(""); const [error, setError] = useState(""); return { message, error, ok: setMessage, fail: (e: unknown) => setError(humanizeApiError(e)), clear: () => { setMessage(""); setError(""); } }; }

function PublicationsForm({ onDone }: { onDone: () => void }) {
  const notice = useNotice();
  const authors = useQuery({ queryKey: ["newsroom-authors"], queryFn: () => newsroomApi.authors() });
  const categories = useQuery({ queryKey: ["newsroom-categories"], queryFn: () => newsroomApi.categories() });
  const tags = useQuery({ queryKey: ["newsroom-tags"], queryFn: () => newsroomApi.tags() });
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [reactionsEnabled, setReactionsEnabled] = useState(true);
  const mutation = useMutation({
    mutationFn: async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      notice.clear();
      const form = new FormData(event.currentTarget);
      return newsroomApi.createPublication({
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
        seoMetadata: { description: fstr(form, "seoDescription") || fstr(form, "summary") }
      });
    },
    onSuccess: () => {
      notice.ok("Publicación creada. Queda en borrador o programada según el formulario.");
      setTagIds([]);
      onDone();
    },
    onError: notice.fail
  });
  return (
    <Panel title="Crear publicación" description="Formulario editorial adaptado al estilo de Corazón Migrante." icon={<Plus className="h-5 w-5" />}>
      <form className="grid gap-4 xl:grid-cols-3" onSubmit={(e) => mutation.mutate(e)}>
        <Field label="Título" className="xl:col-span-2"><NativeInput name="title" required minLength={4} /></Field>
        <Field label="Slug opcional"><NativeInput name="slug" /></Field>
        <Field label="Autor"><Select name="authorId" required defaultValue=""><option value="" disabled>{authors.isLoading ? "Cargando..." : "Seleccionar"}</option>{(authors.data ?? []).map((a) => <option key={a.id} value={a.id}>{a.displayName}</option>)}</Select></Field>
        <Field label="Categoría"><Select name="categoryId" required defaultValue=""><option value="" disabled>{categories.isLoading ? "Cargando..." : "Seleccionar"}</option>{(categories.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Tipo"><Select name="publicationType" defaultValue="NEWS">{TYPES.map((type) => <option key={type} value={type}>{typeLabel(type)}</option>)}</Select></Field>
        <Field label="Acceso"><Select name="accessType" defaultValue="PUBLIC"><option value="PUBLIC">Público</option><option value="PREMIUM">Premium</option><option value="INTERNAL_ONLY">Interno</option></Select></Field>
        <Field label="Programar"><NativeInput name="scheduledAt" type="datetime-local" /></Field>
        <Field label="Tags" className="xl:col-span-2" hint="Busca por nombre y haz clic para agregar; haz clic en la X para quitar.">
          <TagPicker options={(tags.data ?? []).map((t) => ({ id: t.id, name: t.name }))} value={tagIds} onChange={setTagIds} loading={tags.isLoading} />
        </Field>
        <Field label="Resumen" className="xl:col-span-3"><NativeTextarea name="summary" required minLength={10} className="min-h-24" /></Field>
        <Field label="Cuerpo" className="xl:col-span-3"><NativeTextarea name="body" required minLength={20} className="min-h-64" /></Field>
        <Field label="Descripción SEO" className="xl:col-span-2"><NativeInput name="seoDescription" /></Field>
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
        <div className="xl:col-span-3"><Submit pending={mutation.isPending} label="Crear publicación" /></div>
        <div className="xl:col-span-3"><Notice message={notice.message} error={notice.error} /></div>
      </form>
    </Panel>
  );
}

function PublicationActions({ row, onDone }: { row: Publication; onDone: () => void }) {
  const [error, setError] = useState("");
  const publish = useMutation({ mutationFn: () => newsroomApi.publish(row.id), onSuccess: onDone, onError: (e) => setError(humanizeApiError(e)) });
  const archive = useMutation({ mutationFn: () => newsroomApi.archive(row.id), onSuccess: onDone, onError: (e) => setError(humanizeApiError(e)) });
  return <div className="grid gap-2"><div className="flex flex-wrap gap-2"><Button size="sm" asChild variant="outline"><Link href={{ pathname: "/novedades/detalle", query: { slug: row.slug } }}>Ver</Link></Button><Button size="sm" disabled={publish.isPending || row.status === "PUBLISHED"} onClick={() => publish.mutate()}><Send className="h-4 w-4" />Publicar</Button><Button size="sm" variant="outline" disabled={archive.isPending || row.status === "ARCHIVED"} onClick={() => archive.mutate()}><Archive className="h-4 w-4" />Archivar</Button></div>{error ? <p className="text-xs text-red-700">{error}</p> : null}</div>;
}

export function PublicationsAdmin() {
  const qc = useQueryClient(); const [page, setPage] = useState(1); const [type, setType] = useState("");
  const query = useQuery({ queryKey: ["newsroom-publications", page, type], queryFn: () => newsroomApi.listPublications({ page, pageSize: PAGE_SIZE, publicationType: type as PublicationType | "", sort: "createdAt", order: "desc" }) });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["newsroom-publications"] });
  return <div className="grid gap-6"><PublicationsForm onDone={refresh} /><Panel title="Publicaciones" description="Noticias, columnas y reportes disponibles en el backend unificado." icon={<Newspaper className="h-5 w-5" />}><div className="mb-5 max-w-xs"><Field label="Tipo"><Select value={type} onChange={(e) => setType(e.target.value)}><option value="">Todos</option>{TYPES.map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}</Select></Field></div>{query.isLoading ? <LoadingState title="Cargando publicaciones" /> : null}{query.isError ? <ErrorState title="No se pudo cargar publicaciones" description={humanizeApiError(query.error)} actionLabel="Reintentar" onAction={() => void query.refetch()} /> : null}{query.data ? <div className="grid gap-4"><DataTable<Publication> data={query.data.items} getRowKey={(r) => r.id} columns={[{ key: "title", header: "Publicación", render: (r) => <div><p className="font-semibold">{r.title}</p><p className="line-clamp-2 text-xs text-muted-foreground">{r.summary}</p></div> }, { key: "type", header: "Tipo", render: (r) => typeLabel(r.publicationType) }, { key: "category", header: "Categoría", render: (r) => r.category?.name ?? "—" }, { key: "status", header: "Estado", render: (r) => <StatusBadge status={r.status} /> }, { key: "date", header: "Fecha", render: (r) => fmtDate(r.publishedAt ?? r.scheduledAt) }, { key: "actions", header: "Acciones", render: (r) => <PublicationActions row={r} onDone={refresh} /> }]} /><PaginationBar page={query.data.page} totalPages={query.data.totalPages} onPrevious={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => Math.min(query.data?.totalPages ?? p, p + 1))} /></div> : null}</Panel></div>;
}

export function CategoriesAdmin() { const qc = useQueryClient(); const notice = useNotice(); const query = useQuery({ queryKey: ["newsroom-categories"], queryFn: () => newsroomApi.categories() }); const mutation = useMutation({ mutationFn: async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); notice.clear(); const form = new FormData(e.currentTarget); return newsroomApi.createCategory({ name: fstr(form, "name"), slug: fstr(form, "slug") || undefined, description: fstr(form, "description") || undefined, isActive: fstr(form, "isActive") === "true", sortOrder: fnum(form, "sortOrder", 0) }); }, onSuccess: () => { notice.ok("Categoría creada."); void qc.invalidateQueries({ queryKey: ["newsroom-categories"] }); }, onError: notice.fail }); return <TaxonomyShell title="Categorías editoriales" notice={notice} mutationPending={mutation.isPending} onSubmit={(e) => mutation.mutate(e)}>{query.isLoading ? <LoadingState title="Cargando categorías" /> : null}{query.isError ? <ErrorState title="No se pudo cargar categorías" description={humanizeApiError(query.error)} /> : null}{query.data ? <DataTable<Category> data={query.data} getRowKey={(r) => r.id} columns={[{ key: "name", header: "Nombre", render: (r) => <b>{r.name}</b> }, { key: "slug", header: "Slug", render: (r) => r.slug }, { key: "status", header: "Estado", render: (r) => <StatusBadge status={r.isActive} /> }, { key: "id", header: "ID", render: (r) => <code className="text-xs">{r.id}</code> }]} /> : null}</TaxonomyShell>; }
function TaxonomyShell({ title, notice, mutationPending, onSubmit, children }: { title: string; notice: ReturnType<typeof useNotice>; mutationPending: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; children: ReactNode }) { return <div className="grid gap-6"><Panel title={`Crear ${title.toLowerCase()}`} icon={<Tags className="h-5 w-5" />}><form className="grid gap-4 md:grid-cols-4" onSubmit={onSubmit}><Field label="Nombre"><NativeInput name="name" required minLength={2} /></Field><Field label="Slug"><NativeInput name="slug" /></Field><Field label="Orden"><NativeInput name="sortOrder" type="number" defaultValue={0} /></Field><Field label="Estado"><Select name="isActive" defaultValue="true"><option value="true">Activo</option><option value="false">Inactivo</option></Select></Field><Field label="Descripción" className="md:col-span-4"><NativeTextarea name="description" /></Field><div className="md:col-span-4"><Submit pending={mutationPending} label="Crear" /></div><div className="md:col-span-4"><Notice message={notice.message} error={notice.error} /></div></form></Panel><Panel title={title}>{children}</Panel></div>; }
export function TagsAdmin() { const qc = useQueryClient(); const notice = useNotice(); const query = useQuery({ queryKey: ["newsroom-tags"], queryFn: () => newsroomApi.tags() }); const mutation = useMutation({ mutationFn: async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); notice.clear(); const form = new FormData(e.currentTarget); return newsroomApi.createTag({ name: fstr(form, "name"), slug: fstr(form, "slug") || undefined }); }, onSuccess: () => { notice.ok("Tag creado."); void qc.invalidateQueries({ queryKey: ["newsroom-tags"] }); }, onError: notice.fail }); return <div className="grid gap-6"><Panel title="Crear tag" icon={<Tags className="h-5 w-5" />}><form className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end" onSubmit={(e) => mutation.mutate(e)}><Field label="Nombre"><NativeInput name="name" required /></Field><Field label="Slug"><NativeInput name="slug" /></Field><Submit pending={mutation.isPending} label="Crear" /><div className="md:col-span-3"><Notice message={notice.message} error={notice.error} /></div></form></Panel><Panel title="Tags existentes">{query.isLoading ? <LoadingState title="Cargando tags" /> : null}{query.data ? <DataTable<Tag> data={query.data} getRowKey={(r) => r.id} columns={[{ key: "name", header: "Nombre", render: (r) => <b>{r.name}</b> }, { key: "slug", header: "Slug", render: (r) => r.slug }, { key: "id", header: "ID", render: (r) => <code className="text-xs">{r.id}</code> }]} /> : null}</Panel></div>; }
export function AuthorsAdmin() {
  const qc = useQueryClient();
  const notice = useNotice();
  const query = useQuery({ queryKey: ["newsroom-authors"], queryFn: () => newsroomApi.authors() });
  const [userSearch, setUserSearch] = useState("");
  const [userId, setUserId] = useState("");
  const users = useQuery({ queryKey: ["newsroom-author-users", userSearch], queryFn: () => listUsers({ search: userSearch, page: 1, pageSize: 8 }) });
  const selectedUser = users.data?.items.find((u) => u.id === userId);
  const mutation = useMutation({
    mutationFn: async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      notice.clear();
      const form = new FormData(e.currentTarget);
      return newsroomApi.createAuthor({
        displayName: fstr(form, "displayName"),
        headline: fstr(form, "headline") || undefined,
        bio: fstr(form, "bio") || undefined,
        status: fstr(form, "status") || "ACTIVE",
        email: selectedUser?.email
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
        <form className="grid gap-4 md:grid-cols-3" onSubmit={(e) => mutation.mutate(e)}>
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
                <div className="flex flex-wrap gap-2 rounded-none border bg-card p-2">
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
  const query = useQuery({ queryKey: ["newsroom-subscribers"], queryFn: () => newsroomApi.subscribers({ page: 1, pageSize: 50 }) });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["newsroom-subscribers"] });
  const mutation = useMutation({
    mutationFn: async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      notice.clear();
      const form = new FormData(e.currentTarget);
      return newsroomApi.upsertSubscriber({
        email: fstr(form, "email"),
        displayName: fstr(form, "displayName") || undefined,
        status: fstr(form, "status") || "ACTIVE",
        subscriptionTier: fstr(form, "subscriptionTier") || "FREE",
        premiumUntil: isoLocal(fstr(form, "premiumUntil")),
        source: "admin"
      });
    },
    onSuccess: () => { notice.ok("Suscriptor guardado."); refresh(); },
    onError: notice.fail
  });
  const toggleTier = useMutation({
    mutationFn: (subscriber: ContentSubscriber) => newsroomApi.updateSubscriber(subscriber.id, { subscriptionTier: subscriber.subscriptionTier === "PREMIUM" ? "FREE" : "PREMIUM" }),
    onSuccess: refresh,
    onError: notice.fail
  });
  return (
    <div className="grid gap-6">
      <Panel title="Registrar suscriptor" description="Vincula un correo a una suscripción y define su nivel de acceso." icon={<Users className="h-5 w-5" />}>
        <form className="grid gap-4 md:grid-cols-3" onSubmit={(e) => mutation.mutate(e)}>
          <Field label="Correo"><NativeInput name="email" type="email" required /></Field>
          <Field label="Nombre"><NativeInput name="displayName" /></Field>
          <Field label="Nivel"><Select name="subscriptionTier" defaultValue="FREE"><option value="FREE">Gratuito</option><option value="PREMIUM">Premium</option></Select></Field>
          <Field label="Estado"><Select name="status" defaultValue="ACTIVE"><option value="ACTIVE">Activo</option><option value="UNSUBSCRIBED">Desuscrito</option><option value="SUSPENDED">Suspendido</option></Select></Field>
          <Field label="Premium hasta" hint="Solo aplica si el nivel es premium."><NativeInput name="premiumUntil" type="datetime-local" /></Field>
          <div className="flex items-end md:col-span-1"><Submit pending={mutation.isPending} label="Guardar suscriptor" /></div>
          <div className="md:col-span-3"><Notice message={notice.message} error={notice.error} /></div>
        </form>
      </Panel>
      <Panel title="Suscriptores">
        {query.isLoading ? <LoadingState title="Cargando suscriptores" /> : null}
        {query.isError ? <ErrorState title="No se pudo cargar suscriptores" description={humanizeApiError(query.error)} actionLabel="Reintentar" onAction={() => void query.refetch()} /> : null}
        {query.data ? (
          <DataTable<ContentSubscriber>
            data={query.data.items}
            getRowKey={(r) => r.id}
            columns={[
              { key: "email", header: "Correo", render: (r) => <div><b>{r.displayName || r.email}</b>{r.displayName ? <p className="text-xs text-muted-foreground">{r.email}</p> : null}</div> },
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

export function AdvertisingAdmin() { const qc = useQueryClient(); const notice = useNotice(); const companies = useQuery({ queryKey: ["ads-companies"], queryFn: () => adsApi.companies() }); const placements = useQuery({ queryKey: ["ads-placements"], queryFn: () => adsApi.placements() }); const campaigns = useQuery({ queryKey: ["ads-campaigns"], queryFn: () => adsApi.campaigns({ page: 1, pageSize: 50 }) }); const refresh = () => { void qc.invalidateQueries({ queryKey: ["ads-companies"] }); void qc.invalidateQueries({ queryKey: ["ads-placements"] }); void qc.invalidateQueries({ queryKey: ["ads-campaigns"] }); };
 const companyMutation = useMutation({ mutationFn: async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); notice.clear(); const form = new FormData(e.currentTarget); return adsApi.createCompany({ businessName: fstr(form, "businessName"), commercialName: fstr(form, "commercialName"), contactEmail: fstr(form, "contactEmail") || undefined, contactPhone: fstr(form, "contactPhone") || undefined, status: "ACTIVE" }); }, onSuccess: () => { notice.ok("Empresa creada."); refresh(); }, onError: notice.fail });
 const placementMutation = useMutation({ mutationFn: async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); notice.clear(); const form = new FormData(e.currentTarget); return adsApi.createPlacement({ code: fstr(form, "code"), name: fstr(form, "name"), context: fstr(form, "context") || "HOME", isActive: true, dimensions: { width: fnum(form, "width", 1200), height: fnum(form, "height", 360) } }); }, onSuccess: () => { notice.ok("Ubicación creada."); refresh(); }, onError: notice.fail });
 const campaignMutation = useMutation({ mutationFn: async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); notice.clear(); const form = new FormData(e.currentTarget); return adsApi.createCampaign({ companyId: fstr(form, "companyId"), name: fstr(form, "name"), objective: fstr(form, "objective"), startsAt: isoLocal(fstr(form, "startsAt")) ?? new Date().toISOString(), endsAt: isoLocal(fstr(form, "endsAt")) ?? new Date(Date.now() + 2592000000).toISOString(), budgetAmount: fnum(form, "budgetAmount", 0), currency: "BOB", priority: fnum(form, "priority", 100), placementIds: csv(fstr(form, "placementIds")) }); }, onSuccess: () => { notice.ok("Campaña creada."); refresh(); }, onError: notice.fail });
 const creativeMutation = useMutation({ mutationFn: async (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); notice.clear(); const form = new FormData(e.currentTarget); return adsApi.createCreative(fstr(form, "campaignId"), { title: fstr(form, "title"), assetUrl: fstr(form, "assetUrl"), destinationUrl: fstr(form, "destinationUrl"), altText: fstr(form, "altText"), mediaType: "IMAGE", mimeType: "image/webp", isPrimary: true }); }, onSuccess: () => { notice.ok("Creativo agregado."); refresh(); }, onError: notice.fail });
 const statusMutation = useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => adsApi.setStatus(id, status), onSuccess: refresh, onError: notice.fail });
 return <div className="grid gap-6"><Panel title="Publicidad" description="Empresas, ubicaciones, campañas y piezas del módulo absorbido." icon={<Megaphone className="h-5 w-5" />}><Notice message={notice.message} error={notice.error} /><div className="mt-5 grid gap-6 xl:grid-cols-2"><form className="grid gap-3" onSubmit={(e) => companyMutation.mutate(e)}><h3 className="font-semibold">Empresa anunciante</h3><NativeInput name="businessName" placeholder="Razón social" required /><NativeInput name="commercialName" placeholder="Nombre comercial" required /><NativeInput name="contactEmail" type="email" placeholder="Email" /><NativeInput name="contactPhone" placeholder="Teléfono" /><Submit pending={companyMutation.isPending} label="Crear empresa" /></form><form className="grid gap-3" onSubmit={(e) => placementMutation.mutate(e)}><h3 className="font-semibold">Ubicación</h3><NativeInput name="code" placeholder="home_hero" required /><NativeInput name="name" placeholder="Banner principal" required /><Select name="context" defaultValue="HOME"><option value="HOME">Home</option><option value="ARTICLE">Artículo</option><option value="CATEGORY">Categoría</option></Select><div className="grid gap-3 md:grid-cols-2"><NativeInput name="width" type="number" defaultValue={1200} /><NativeInput name="height" type="number" defaultValue={360} /></div><Submit pending={placementMutation.isPending} label="Crear ubicación" /></form><form className="grid gap-3" onSubmit={(e) => campaignMutation.mutate(e)}><h3 className="font-semibold">Campaña</h3><NativeInput name="name" placeholder="Nombre campaña" required /><Select name="companyId" required defaultValue=""><option value="" disabled>Empresa</option>{(companies.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.commercialName}</option>)}</Select><Select name="objective" defaultValue="PUBLIC_SERVICE"><option value="AWARENESS">Awareness</option><option value="TRAFFIC">Tráfico</option><option value="PUBLIC_SERVICE">Servicio público</option><option value="SPONSORSHIP">Patrocinio</option></Select><div className="grid gap-3 md:grid-cols-2"><NativeInput name="startsAt" type="datetime-local" required /><NativeInput name="endsAt" type="datetime-local" required /></div><NativeInput name="placementIds" placeholder="IDs de ubicaciones separados por coma" /><NativeInput name="budgetAmount" type="number" defaultValue={0} /><NativeInput name="priority" type="number" defaultValue={100} /><Submit pending={campaignMutation.isPending} label="Crear campaña" /></form><form className="grid gap-3" onSubmit={(e) => creativeMutation.mutate(e)}><h3 className="font-semibold">Creativo</h3><Select name="campaignId" required defaultValue=""><option value="" disabled>Campaña</option>{(campaigns.data?.items ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select><NativeInput name="title" placeholder="Título" required /><NativeInput name="assetUrl" type="url" placeholder="URL imagen" required /><NativeInput name="destinationUrl" type="url" placeholder="URL destino" required /><NativeInput name="altText" placeholder="Texto alternativo" required /><Submit pending={creativeMutation.isPending} label="Agregar creativo" /></form></div></Panel><Panel title="Empresas y ubicaciones"><div className="grid gap-6 xl:grid-cols-2">{companies.data ? <DataTable<AdsCompany> data={companies.data} getRowKey={(r) => r.id} columns={[{ key: "name", header: "Empresa", render: (r) => <b>{r.commercialName}</b> }, { key: "contact", header: "Contacto", render: (r) => r.contactEmail ?? r.contactPhone ?? "—" }, { key: "status", header: "Estado", render: (r) => <StatusBadge status={r.status} /> }]} /> : <LoadingState title="Cargando empresas" />}{placements.data ? <DataTable<AdsPlacement> data={placements.data} getRowKey={(r) => r.id} columns={[{ key: "code", header: "Código", render: (r) => <b>{r.code}</b> }, { key: "ctx", header: "Contexto", render: (r) => r.context }, { key: "id", header: "ID", render: (r) => <code className="text-xs">{r.id}</code> }]} /> : <LoadingState title="Cargando ubicaciones" />}</div></Panel><Panel title="Campañas">{campaigns.data ? <DataTable<AdsCampaign> data={campaigns.data.items} getRowKey={(r) => r.id} columns={[{ key: "name", header: "Campaña", render: (r) => <b>{r.name}</b> }, { key: "company", header: "Empresa", render: (r) => r.company?.commercialName ?? r.companyId }, { key: "status", header: "Estado", render: (r) => <StatusBadge status={r.status} /> }, { key: "dates", header: "Vigencia", render: (r) => <span className="text-xs">{fmtDate(r.startsAt)}<br />{fmtDate(r.endsAt)}</span> }, { key: "actions", header: "Acciones", render: (r) => <div className="flex gap-2"><Button size="sm" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: r.id, status: "ACTIVE" })}>Activar</Button><Button size="sm" variant="outline" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate({ id: r.id, status: "PAUSED" })}>Pausar</Button></div> }]} /> : <LoadingState title="Cargando campañas" />}</Panel></div>; }

export function HomepageAdmin() { const preview = useQuery({ queryKey: ["homepage-preview"], queryFn: () => newsroomApi.homepagePreview() }); return <Panel title="Portada editorial" description="Validación de titulares, columnas y layout desde el backend unificado." icon={<Home className="h-5 w-5" />}>{preview.isLoading ? <LoadingState title="Cargando portada" /> : null}{preview.isError ? <ErrorState title="No se pudo cargar portada" description={humanizeApiError(preview.error)} /> : null}{preview.data ? <div className="grid gap-6"><div className="grid gap-4 md:grid-cols-3"><div className="rounded-2xl border p-5"><p className="text-sm text-muted-foreground">Titulares</p><p className="text-3xl font-bold">{preview.data.editorial?.headlines?.length ?? 0}</p></div><div className="rounded-2xl border p-5"><p className="text-sm text-muted-foreground">Columnas</p><p className="text-3xl font-bold">{preview.data.editorial?.columns?.length ?? 0}</p></div><div className="rounded-2xl border p-5"><p className="text-sm text-muted-foreground">Layout</p><p className="text-3xl font-bold">{preview.data.layout?.length ?? 0}</p></div></div><DataTable<Publication> data={[...(preview.data.editorial?.headlines ?? []), ...(preview.data.editorial?.columns ?? [])]} getRowKey={(r) => r.id} columns={[{ key: "title", header: "Publicación", render: (r) => <b>{r.title}</b> }, { key: "type", header: "Tipo", render: (r) => typeLabel(r.publicationType) }, { key: "status", header: "Estado", render: (r) => <StatusBadge status={r.status} /> }, { key: "link", header: "Vista", render: (r) => <Button asChild size="sm" variant="outline"><Link href={{ pathname: "/novedades/detalle", query: { slug: r.slug } }}>Abrir</Link></Button> }]} /></div> : null}</Panel>; }

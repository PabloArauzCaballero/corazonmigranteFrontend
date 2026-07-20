"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tags, UserRoundPlus } from "lucide-react";
import { newsroomApi } from "@/features/newsroom/newsroom.api";
import { listUsers } from "@/features/users/users.api";
import type { Author, Category, Tag } from "@/features/newsroom/newsroom.types";
import { Field, fstr, NativeInput, NativeTextarea, Notice, Panel, Select, StatusBadge, Submit, useNotice } from "@/features/newsroom/admin-kit";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { DataTable } from "@/shared/ui/data-table";
import { ErrorState, LoadingState } from "@/shared/ui/state";

function TaxonomyShell({ title, notice, mutationPending, onSubmit, children }: { title: string; notice: ReturnType<typeof useNotice>; mutationPending: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; children: ReactNode }) {
  return (
    <div className="grid gap-6">
      <Panel title={`Crear ${title.toLowerCase()}`} icon={<Tags className="h-5 w-5" />}>
        <form className="grid gap-4 md:grid-cols-4" onSubmit={onSubmit}>
          <Field label="Nombre"><NativeInput name="name" required minLength={2} /></Field>
          <Field label="Slug"><NativeInput name="slug" /></Field>
          <Field label="Orden"><NativeInput name="sortOrder" type="number" defaultValue={0} /></Field>
          <Field label="Estado"><Select name="isActive" defaultValue="true"><option value="true">Activo</option><option value="false">Inactivo</option></Select></Field>
          <Field label="Descripción" className="md:col-span-4"><NativeTextarea name="description" /></Field>
          <div className="md:col-span-4"><Submit pending={mutationPending} label="Crear" /></div>
          <div className="md:col-span-4"><Notice message={notice.message} error={notice.error} /></div>
        </form>
      </Panel>
      <Panel title={title}>{children}</Panel>
    </div>
  );
}

export function CategoriesAdmin() {
  const qc = useQueryClient();
  const notice = useNotice();
  const query = useQuery({ queryKey: ["newsroom-categories"], queryFn: () => newsroomApi.categories() });
  const mutation = useMutation({
    mutationFn: async (form: FormData) => {
      notice.clear();
      return newsroomApi.createCategory({ name: fstr(form, "name"), slug: fstr(form, "slug") || undefined, description: fstr(form, "description") || undefined, isActive: fstr(form, "isActive") === "true", sortOrder: Number(fstr(form, "sortOrder")) || 0 });
    },
    onSuccess: () => { notice.ok("Categoría creada."); void qc.invalidateQueries({ queryKey: ["newsroom-categories"] }); },
    onError: notice.fail
  });
  return (
    <TaxonomyShell title="Categorías editoriales" notice={notice} mutationPending={mutation.isPending} onSubmit={(e) => { e.preventDefault(); mutation.mutate(new FormData(e.currentTarget)); }}>
      {query.isLoading ? <LoadingState title="Cargando categorías" /> : null}
      {query.isError ? <ErrorState title="No se pudo cargar categorías" description={humanizeApiError(query.error)} /> : null}
      {query.data ? <DataTable<Category> data={query.data} getRowKey={(r) => r.id} columns={[{ key: "name", header: "Nombre", render: (r) => <b>{r.name}</b> }, { key: "slug", header: "Slug", render: (r) => r.slug }, { key: "status", header: "Estado", render: (r) => <StatusBadge status={r.isActive} /> }, { key: "id", header: "ID", render: (r) => <code className="text-xs">{r.id}</code> }]} /> : null}
    </TaxonomyShell>
  );
}

export function TagsAdmin() {
  const qc = useQueryClient();
  const notice = useNotice();
  const query = useQuery({ queryKey: ["newsroom-tags"], queryFn: () => newsroomApi.tags() });
  const mutation = useMutation({
    mutationFn: async (form: FormData) => { notice.clear(); return newsroomApi.createTag({ name: fstr(form, "name"), slug: fstr(form, "slug") || undefined }); },
    onSuccess: () => { notice.ok("Tag creado."); void qc.invalidateQueries({ queryKey: ["newsroom-tags"] }); },
    onError: notice.fail
  });
  return (
    <div className="grid gap-6">
      <Panel title="Crear tag" icon={<Tags className="h-5 w-5" />}>
        <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end" onSubmit={(e) => { e.preventDefault(); mutation.mutate(new FormData(e.currentTarget)); }}>
          <Field label="Nombre"><NativeInput name="name" required /></Field>
          <Field label="Slug"><NativeInput name="slug" /></Field>
          <Submit pending={mutation.isPending} label="Crear" />
          <div className="md:col-span-3"><Notice message={notice.message} error={notice.error} /></div>
        </form>
      </Panel>
      <Panel title="Tags existentes">
        {query.isLoading ? <LoadingState title="Cargando tags" /> : null}
        {query.data ? <DataTable<Tag> data={query.data} getRowKey={(r) => r.id} columns={[{ key: "name", header: "Nombre", render: (r) => <b>{r.name}</b> }, { key: "slug", header: "Slug", render: (r) => r.slug }, { key: "id", header: "ID", render: (r) => <code className="text-xs">{r.id}</code> }]} /> : null}
      </Panel>
    </div>
  );
}

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
      return newsroomApi.createAuthor({ displayName: fstr(form, "displayName"), headline: fstr(form, "headline") || undefined, bio: fstr(form, "bio") || undefined, status: fstr(form, "status") || "ACTIVE", userId: userId || undefined });
    },
    onSuccess: () => { notice.ok("Autor creado."); setUserId(""); setUserSearch(""); void qc.invalidateQueries({ queryKey: ["newsroom-authors"] }); },
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
              <NativeInput value={userId ? (selectedUser?.name ?? "") : userSearch} onChange={(e) => { setUserId(""); setUserSearch(e.target.value); }} placeholder={users.isLoading ? "Cargando usuarios..." : "Buscar usuario..."} />
              {!userId && userSearch.trim() && users.data?.items.length ? (
                <div className="flex flex-wrap gap-2 rounded-xl border bg-card p-2">
                  {users.data.items.map((u) => (
                    <button key={u.id} type="button" className="rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:border-primary hover:text-primary" onClick={() => { setUserId(u.id); setUserSearch(""); }}>
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

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useRef, useState } from "react";
import type { AdminUser, AdminUserStatus } from "@/features/users/users.types";
import { createUser, listUsers, updateTherapistProfileByAdmin, updateUserStatus, type CreateUserInput, type UpdateTherapistProfileInput } from "@/features/users/users.api";
import { fetchProfessions, fetchSpecialties } from "@/features/auth/public-options";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { DataTable, PaginationBar } from "@/shared/ui/data-table";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ErrorState, LoadingState } from "@/shared/ui/state";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";
import { uploadUserPhoto } from "@/shared/api/files";

const PAGE_SIZE = 20;

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

function UserAvatar({ user }: { user: AdminUser }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className="h-10 w-10 rounded-full border object-cover"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    );
  }
  return (
    <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/12 text-sm font-bold text-primary">
      {initialsFrom(user.name)}
    </span>
  );
}

const statusActions: { value: AdminUserStatus; label: string }[] = [
  { value: "activo", label: "Activar" },
  { value: "bloqueado", label: "Bloquear" },
  { value: "pendiente", label: "Marcar pendiente" }
];

function EditTherapistAction({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const mutation = useMutation({
    mutationFn: (input: UpdateTherapistProfileInput) => updateTherapistProfileByAdmin(user.id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false);
    }
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    mutation.mutate({
      firstName: String(form.get("firstName") ?? ""),
      lastName: String(form.get("lastName") ?? ""),
      phone: String(form.get("phone") ?? ""),
      title: String(form.get("title") ?? ""),
      mainSpecialty: String(form.get("mainSpecialty") ?? ""),
      personalPhrase: String(form.get("personalPhrase") ?? ""),
      bio: String(form.get("bio") ?? "")
    });
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Editar terapeuta</Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Información de ${user.name}`} description="Actualiza los datos profesionales del terapeuta.">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="grid gap-2"><Label>Nombre</Label><Input name="firstName" /></div>
          <div className="grid gap-2"><Label>Apellido</Label><Input name="lastName" /></div>
          <div className="grid gap-2"><Label>Teléfono</Label><Input name="phone" /></div>
          <div className="grid gap-2"><Label>Título profesional</Label><Input name="title" /></div>
          <div className="grid gap-2 md:col-span-2"><Label>Especialidad principal</Label><Input name="mainSpecialty" /></div>
          <div className="grid gap-2 md:col-span-2"><Label>Frase personal</Label><Input name="personalPhrase" /></div>
          <div className="grid gap-2 md:col-span-2"><Label>Bio</Label><Input name="bio" /></div>
          <p className="text-xs text-muted-foreground md:col-span-2">Solo se envían los campos con contenido; los vacíos no modifican el perfil.</p>
          {mutation.isError ? <p className="text-sm text-destructive md:col-span-2">{humanizeApiError(mutation.error)}</p> : null}
          <div className="md:col-span-2"><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Guardando..." : "Guardar cambios"}</Button></div>
        </form>
      </Modal>
    </>
  );
}

function UploadPhotoAction({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const mutation = useMutation({
    mutationFn: (file: File) => uploadUserPhoto(user.id, file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) mutation.mutate(file);
          event.currentTarget.value = "";
        }}
      />
      <Button size="sm" variant="outline" disabled={mutation.isPending} onClick={() => inputRef.current?.click()}>
        {mutation.isPending ? "Subiendo..." : "Subir foto"}
      </Button>
      {mutation.isError ? <p className="w-full text-xs text-destructive">{humanizeApiError(mutation.error)}</p> : null}
    </>
  );
}

function StatusActions({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (status: AdminUserStatus) => updateUserStatus(user.id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });

  return (
    <div className="flex flex-wrap gap-2">
      {statusActions
        .filter((action) => action.value !== user.status)
        .map((action) => (
          <Button
            key={action.value}
            size="sm"
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(action.value)}
          >
            {action.label}
          </Button>
        ))}
      {mutation.isError ? <p className="w-full text-xs text-destructive">{humanizeApiError(mutation.error)}</p> : null}
    </div>
  );
}

export function UsersTable() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [role, setRole] = useState<CreateUserInput["role"]>("PACIENTE");
  const debouncedSearch = useDebounce(search);

  const query = useQuery({
    queryKey: ["users", { search: debouncedSearch, page, pageSize: PAGE_SIZE }],
    queryFn: () => listUsers({ search: debouncedSearch, page, pageSize: PAGE_SIZE })
  });
  const specialties = useQuery({ queryKey: ["public-options", "specialties"], queryFn: fetchSpecialties, enabled: role === "TERAPEUTA" });
  const professions = useQuery({ queryKey: ["public-options", "professions"], queryFn: fetchProfessions, enabled: role === "TERAPEUTA" });

  const createMutation = useMutation({
    mutationFn: async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      return createUser({
        role,
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        firstName: String(form.get("firstName") ?? ""),
        lastName: String(form.get("lastName") ?? ""),
        phone: String(form.get("phone") ?? ""),
        title: String(form.get("title") ?? ""),
        mainSpecialty: String(form.get("mainSpecialty") ?? ""),
        bio: String(form.get("bio") ?? ""),
        personalPhrase: String(form.get("personalPhrase") ?? "")
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });

  return (
    <div className="grid gap-6">
      <form className="grid gap-4 rounded-2xl border bg-card p-6 shadow-sm md:grid-cols-2" onSubmit={(event) => createMutation.mutate(event)}>
        <div className="md:col-span-2">
          <h2 className="text-lg font-bold">Crear usuario</h2>
          <p className="mt-1 text-sm text-muted-foreground">El backend actual permite registrar pacientes y terapeutas. Los roles administrativos requieren endpoint dedicado.</p>
        </div>
        <div className="grid gap-2">
          <Label>Rol</Label>
          <select className="focus-ring h-11 rounded-xl border bg-background px-3 text-sm" value={role} onChange={(event) => setRole(event.target.value as CreateUserInput["role"])}>
            <option value="PACIENTE">Paciente</option>
            <option value="TERAPEUTA">Terapeuta</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super admin</option>
            <option value="CONTADOR">Contador</option>
          </select>
        </div>
        <div className="grid gap-2"><Label>Correo</Label><Input name="email" type="email" required /></div>
        <div className="grid gap-2"><Label>Nombre</Label><Input name="firstName" required /></div>
        <div className="grid gap-2"><Label>Apellido</Label><Input name="lastName" required /></div>
        <div className="grid gap-2"><Label>Telefono</Label><Input name="phone" /></div>
        <div className="grid gap-2"><Label>Contrasena temporal</Label><Input name="password" type="password" required minLength={8} /></div>
        {role === "TERAPEUTA" ? (
          <>
            <div className="grid gap-2">
              <Label>Titulo profesional</Label>
              <select name="title" required className="focus-ring h-11 rounded-xl border bg-background px-3 text-sm" disabled={professions.isLoading}>
                <option value="">{professions.isLoading ? "Cargando..." : "Seleccionar titulo"}</option>
                {professions.data?.map((title) => <option key={title} value={title}>{title}</option>)}
              </select>
              {professions.isError ? <p className="text-xs text-destructive">No se pudo cargar el catálogo de títulos.</p> : null}
            </div>
            <div className="grid gap-2">
              <Label>Especialidad principal</Label>
              <select name="mainSpecialty" required className="focus-ring h-11 rounded-xl border bg-background px-3 text-sm" disabled={specialties.isLoading}>
                <option value="">{specialties.isLoading ? "Cargando..." : "Seleccionar especialidad"}</option>
                {specialties.data?.map((specialty) => <option key={specialty} value={specialty}>{specialty}</option>)}
              </select>
              {specialties.isError ? <p className="text-xs text-destructive">No se pudo cargar el catálogo de especialidades.</p> : null}
            </div>
            <div className="grid gap-2 md:col-span-2"><Label>Bio</Label><Input name="bio" /></div>
          </>
        ) : null}
        {createMutation.isError ? <p className="text-sm text-destructive md:col-span-2">{humanizeApiError(createMutation.error)}</p> : null}
        {createMutation.isSuccess ? <p className="text-sm text-emerald-700 md:col-span-2">Usuario enviado al backend correctamente.</p> : null}
        <div className="md:col-span-2"><Button disabled={createMutation.isPending} type="submit">{createMutation.isPending ? "Creando..." : "Crear usuario"}</Button></div>
      </form>

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <Label htmlFor="usersSearch">Buscar usuarios</Label>
        <Input
          id="usersSearch"
          className="mt-2 max-w-md"
          placeholder="Nombre, correo o rol"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <p className="mt-2 text-xs text-muted-foreground">La búsqueda, paginación y filtros se procesan con datos completos.</p>
      </div>

      {query.isLoading ? <LoadingState title="Consultando usuarios" /> : null}
      {query.isError ? <ErrorState title="No se pudieron cargar los usuarios" description={humanizeApiError(query.error)} actionLabel="Reintentar" onAction={() => void query.refetch()} /> : null}
      {query.data ? (
        <>
          <DataTable<AdminUser>
            data={query.data.items}
            getRowKey={(row) => row.id}
            columns={[
              {
                key: "name",
                header: "Usuario",
                render: (row) => (
                  <div className="flex items-center gap-3">
                    <UserAvatar user={row} />
                    <div>
                      <p className="font-semibold">{row.name}</p>
                      <p className="text-xs text-muted-foreground">{row.email}</p>
                    </div>
                  </div>
                )
              },
              { key: "role", header: "Rol", render: (row) => <Badge variant="secondary">{row.role}</Badge> },
              { key: "status", header: "Estado", render: (row) => <Badge variant={row.status === "activo" ? "success" : row.status === "pendiente" ? "warning" : "muted"}>{row.status}</Badge> },
              { key: "actions", header: "Acciones", render: (row) => (
                  <div className="flex flex-wrap gap-2">
                    <UploadPhotoAction user={row} />
                    {row.role === "TERAPEUTA" ? <EditTherapistAction user={row} /> : null}
                    <StatusActions user={row} />
                  </div>
                ) }
            ]}
          />
          <PaginationBar page={query.data.page} totalPages={query.data.totalPages} onPrevious={() => setPage((current) => Math.max(1, current - 1))} onNext={() => setPage((current) => Math.min(query.data.totalPages, current + 1))} />
        </>
      ) : null}
    </div>
  );
}

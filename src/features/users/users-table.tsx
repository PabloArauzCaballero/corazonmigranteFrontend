"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { AdminUser } from "@/features/users/users.types";
import { createUser, listUsers, type CreateUserInput } from "@/features/users/users.api";
import {
  AdminTherapistSchedulesAction,
  DeleteUserAction,
  EditTherapistAction,
  EditUserAction,
  IconButtonLabel,
  ResetPasswordAction,
  StatusActions,
  UploadPhotoAction
} from "@/features/users/user-actions";
import { fetchProfessions, fetchSpecialties } from "@/features/auth/public-options";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { DataTable, DataTableSkeleton, PaginationBar } from "@/shared/ui/data-table";
import { TableShell } from "@/shared/ui/table-shell";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ErrorState } from "@/shared/ui/state";
import { Button } from "@/shared/ui/button";
import { useToast } from "@/shared/ui/toast";

const PAGE_SIZE = 20;

const SELECT_CLASS =
  "focus-ring h-14 w-full rounded-[14px] border border-slate-500/80 bg-surface-raised px-4 py-3 text-sm shadow-sm hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50";

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

export function UsersTable() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const createFormRef = useRef<HTMLFormElement>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [role, setRole] = useState<CreateUserInput["role"]>("PACIENTE");
  const debouncedSearch = useDebounce(search);

  const query = useQuery({
    queryKey: ["users", { search: debouncedSearch, page, pageSize: PAGE_SIZE, role: roleFilter }],
    queryFn: () => listUsers({ search: debouncedSearch, page, pageSize: PAGE_SIZE, role: roleFilter || undefined })
  });
  const specialties = useQuery({ queryKey: ["public-options", "specialties"], queryFn: fetchSpecialties, enabled: role === "TERAPEUTA" });
  const professions = useQuery({ queryKey: ["public-options", "professions"], queryFn: fetchProfessions, enabled: role === "TERAPEUTA" });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      createFormRef.current?.reset();
      toast({ variant: "success", title: "Usuario creado", description: "Ya puede iniciar sesión con la contraseña que le asignaste." });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });

  function onCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    createMutation.mutate({
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
  }

  return (
    <div className="grid gap-6">
      <form ref={createFormRef} className="animate-fade-in grid gap-4 rounded-2xl border bg-card p-6 shadow-sm md:grid-cols-2" onSubmit={onCreateUser}>
        <div className="md:col-span-2">
          <h2 className="text-lg font-bold">Crear usuario</h2>
          <p className="mt-1 text-sm text-muted-foreground">Puedes dar de alta cualquier rol: paciente, terapeuta, admin, super admin o contador.</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="new-user-role">Rol</Label>
          <select id="new-user-role" className={SELECT_CLASS} value={role} onChange={(event) => setRole(event.target.value as CreateUserInput["role"])}>
            <option value="PACIENTE">Paciente</option>
            <option value="TERAPEUTA">Terapeuta</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super admin</option>
            <option value="CONTADOR">Contador</option>
          </select>
        </div>
        <div className="grid gap-2"><Label htmlFor="new-user-email">Correo</Label><Input id="new-user-email" name="email" type="email" required /></div>
        <div className="grid gap-2"><Label htmlFor="new-user-first">Nombre</Label><Input id="new-user-first" name="firstName" required /></div>
        <div className="grid gap-2"><Label htmlFor="new-user-last">Apellido</Label><Input id="new-user-last" name="lastName" required /></div>
        <div className="grid gap-2"><Label htmlFor="new-user-phone">Teléfono</Label><Input id="new-user-phone" name="phone" /></div>
        <div className="grid gap-2"><Label htmlFor="new-user-password">Contraseña temporal</Label><Input id="new-user-password" name="password" type="password" required minLength={8} /></div>
        {role === "TERAPEUTA" ? (
          <>
            <div className="grid gap-2">
              <Label htmlFor="new-user-title">Título profesional</Label>
              <select id="new-user-title" name="title" required className={SELECT_CLASS} disabled={professions.isLoading}>
                <option value="">{professions.isLoading ? "Cargando..." : "Seleccionar título"}</option>
                {professions.data?.map((title) => <option key={title} value={title}>{title}</option>)}
              </select>
              {professions.isError ? <p className="text-xs text-destructive">No se pudo cargar el catálogo de títulos.</p> : null}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-user-specialty">Especialidad principal</Label>
              <select id="new-user-specialty" name="mainSpecialty" required className={SELECT_CLASS} disabled={specialties.isLoading}>
                <option value="">{specialties.isLoading ? "Cargando..." : "Seleccionar especialidad"}</option>
                {specialties.data?.map((specialty) => <option key={specialty} value={specialty}>{specialty}</option>)}
              </select>
              {specialties.isError ? <p className="text-xs text-destructive">No se pudo cargar el catálogo de especialidades.</p> : null}
            </div>
            <div className="grid gap-2 md:col-span-2"><Label htmlFor="new-user-bio">Bio</Label><Input id="new-user-bio" name="bio" /></div>
          </>
        ) : null}
        {createMutation.isError ? <p className="text-sm text-destructive md:col-span-2">{humanizeApiError(createMutation.error)}</p> : null}
        <div className="md:col-span-2">
          <Button disabled={createMutation.isPending} type="submit" title="Crear usuario" aria-label="Crear usuario">
            <IconButtonLabel icon={createMutation.isPending ? "spinner" : "plus"} label={createMutation.isPending ? "Creando usuario" : "Crear usuario"} spin={createMutation.isPending} />
          </Button>
        </div>
      </form>

      <TableShell
        filters={
          <>
            <div className="relative min-w-48 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="usersSearch"
                className="pl-9"
                placeholder="Buscar por nombre o correo..."
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              />
            </div>
            <select
              className="h-10 rounded-xl border bg-background px-3 text-sm"
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              aria-label="Filtrar por rol"
            >
              <option value="">Todos los roles</option>
              <option value="PACIENTE">Pacientes</option>
              <option value="TERAPEUTA">Terapeutas</option>
              <option value="ADMIN">Admins</option>
              <option value="SUPER_ADMIN">Super admins</option>
              <option value="CONTADOR">Contadores</option>
            </select>
            {query.data && (
              <span className="text-xs text-muted-foreground">
                {query.data.total} usuario{query.data.total !== 1 ? "s" : ""} encontrado{query.data.total !== 1 ? "s" : ""}
              </span>
            )}
          </>
        }
        footer={query.data ? <PaginationBar page={query.data.page} totalPages={query.data.totalPages} loading={query.isFetching} onPrevious={() => setPage((current) => Math.max(1, current - 1))} onNext={() => setPage((current) => Math.min(query.data.totalPages, current + 1))} onGoTo={(p) => setPage(p)} /> : undefined}
      >
        {query.isLoading ? <DataTableSkeleton columns={4} rows={8} /> : null}
        {query.isError ? <ErrorState title="No se pudieron cargar los usuarios" description={humanizeApiError(query.error)} actionLabel="Reintentar" onAction={() => void query.refetch()} /> : null}
        {query.data ? (
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
                    <EditUserAction user={row} />
                    <UploadPhotoAction user={row} />
                    {row.role === "TERAPEUTA" ? <><EditTherapistAction user={row} /><AdminTherapistSchedulesAction user={row} /></> : null}
                    <ResetPasswordAction user={row} />
                    <StatusActions user={row} />
                    <DeleteUserAction user={row} />
                  </div>
                ) }
            ]}
          />
        ) : null}
      </TableShell>
    </div>
  );
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import type { AdminUser } from "@/features/users/users.types";
import { createUser, listUsers, type CreateUserInput } from "@/features/users/users.api";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { DataTable, PaginationBar } from "@/shared/ui/data-table";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ErrorState, LoadingState } from "@/shared/ui/state";
import { Button } from "@/shared/ui/button";

const PAGE_SIZE = 20;

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
    <div className="grid gap-4">
      <form className="grid gap-4 border border-slate-200 bg-white p-5 md:grid-cols-2" onSubmit={(event) => createMutation.mutate(event)}>
        <div className="md:col-span-2">
          <h2 className="font-serif text-2xl font-bold">Crear usuario</h2>
          <p className="mt-1 text-sm text-slate-600">El backend actual permite registrar pacientes y terapeutas. Los roles administrativos requieren endpoint dedicado.</p>
        </div>
        <div className="grid gap-2"><Label>Rol</Label><select className="focus-ring h-11 rounded-none border bg-background px-3 text-sm" value={role} onChange={(event) => setRole(event.target.value as CreateUserInput["role"])}><option value="PACIENTE">Paciente</option><option value="TERAPEUTA">Terapeuta</option><option value="ADMIN">Admin</option><option value="SUPER_ADMIN">Super admin</option><option value="CONTADOR">Contador</option></select></div>
        <div className="grid gap-2"><Label>Correo</Label><Input name="email" type="email" required className="rounded-none" /></div>
        <div className="grid gap-2"><Label>Nombre</Label><Input name="firstName" required className="rounded-none" /></div>
        <div className="grid gap-2"><Label>Apellido</Label><Input name="lastName" required className="rounded-none" /></div>
        <div className="grid gap-2"><Label>Telefono</Label><Input name="phone" className="rounded-none" /></div>
        <div className="grid gap-2"><Label>Contrasena temporal</Label><Input name="password" type="password" required minLength={8} className="rounded-none" /></div>
        {role === "TERAPEUTA" ? (
          <>
            <div className="grid gap-2"><Label>Titulo profesional</Label><Input name="title" required className="rounded-none" /></div>
            <div className="grid gap-2"><Label>Especialidad principal</Label><Input name="mainSpecialty" required className="rounded-none" /></div>
            <div className="grid gap-2 md:col-span-2"><Label>Bio</Label><Input name="bio" className="rounded-none" /></div>
          </>
        ) : null}
        {createMutation.isError ? <p className="text-sm text-red-700 md:col-span-2">{humanizeApiError(createMutation.error)}</p> : null}
        {createMutation.isSuccess ? <p className="text-sm text-emerald-700 md:col-span-2">Usuario enviado al backend correctamente.</p> : null}
        <div className="md:col-span-2"><Button disabled={createMutation.isPending} className="rounded-none bg-teal-900 hover:bg-teal-950">{createMutation.isPending ? "Creando..." : "Crear usuario"}</Button></div>
      </form>
      <div className="rounded-2xl border bg-card p-4">
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
              { key: "name", header: "Nombre", render: (row) => <span className="font-semibold">{row.name}</span> },
              { key: "email", header: "Correo", render: (row) => row.email },
              { key: "role", header: "Rol", render: (row) => <Badge variant="secondary">{row.role}</Badge> },
              { key: "status", header: "Estado", render: (row) => <Badge variant={row.status === "activo" ? "success" : row.status === "pendiente" ? "warning" : "muted"}>{row.status}</Badge> }
            ]}
          />
          <PaginationBar page={query.data.page} totalPages={query.data.totalPages} onPrevious={() => setPage((current) => Math.max(1, current - 1))} onNext={() => setPage((current) => Math.min(query.data.totalPages, current + 1))} />
        </>
      ) : null}
    </div>
  );
}

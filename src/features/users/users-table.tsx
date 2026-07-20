"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { AdminUser, AdminUserStatus } from "@/features/users/users.types";
import { createUser, listUsers, updateTherapistProfileByAdmin, uploadUserPhotoByAdmin, updateUserStatus, type CreateUserInput, type UpdateTherapistProfileInput } from "@/features/users/users.api";
import { createAdminTherapistSchedule, deactivateAdminTherapistSchedule, listAdminTherapistSchedules, type TherapistScheduleInput, type TherapistScheduleRow } from "@/features/therapy/therapy.api";
import { fetchProfessions, fetchSpecialties } from "@/features/auth/public-options";
import { useDebounce } from "@/shared/hooks/use-debounce";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { DataTable, DataTableSkeleton, PaginationBar } from "@/shared/ui/data-table";
import { TableShell } from "@/shared/ui/table-shell";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { ErrorState, LoadingState } from "@/shared/ui/state";
import { Button } from "@/shared/ui/button";
import { Modal } from "@/shared/ui/modal";
import { FaIcon, type FaIconName } from "@/shared/ui/fontawesome";

const PAGE_SIZE = 20;
const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];


function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/La_Paz";
  } catch {
    return "America/La_Paz";
  }
}

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


function IconButtonLabel({ icon, label, spin = false }: { icon: FaIconName; label: string; spin?: boolean }) {
  return (
    <>
      <FaIcon name={icon} className={`h-4 w-4 ${spin ? "animate-spin" : ""}`} />
      <span className="sr-only">{label}</span>
    </>
  );
}

function statusIcon(status: AdminUserStatus): FaIconName {
  if (status === "activo") return "circle-check";
  if (status === "bloqueado") return "lock";
  return "clock";
}

const statusActions: { value: AdminUserStatus; label: string }[] = [
  { value: "activo", label: "Activar" },
  { value: "bloqueado", label: "Bloquear" },
  { value: "pendiente", label: "Marcar pendiente" }
];

function optionValues(values?: string[], current?: string) {
  const set = new Set<string>();
  if (current?.trim()) set.add(current.trim());
  for (const value of values ?? []) {
    if (value.trim()) set.add(value.trim());
  }
  return [...set];
}

function EditTherapistAction({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const profile = user.therapistProfile;
  const professions = useQuery({ queryKey: ["public-options", "professions", "edit-therapist"], queryFn: fetchProfessions, enabled: open });
  const specialties = useQuery({ queryKey: ["public-options", "specialties", "edit-therapist"], queryFn: fetchSpecialties, enabled: open });
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

  const titleOptions = optionValues(professions.data, profile?.title);
  const specialtyOptions = optionValues(specialties.data, profile?.mainSpecialty);

  return (
    <>
      <Button size="icon" variant="outline" title="Editar terapeuta" aria-label="Editar terapeuta" onClick={() => setOpen(true)}><IconButtonLabel icon="pencil" label="Editar terapeuta" /></Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Información de ${user.name}`} description="Actualiza los datos profesionales del terapeuta.">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="grid gap-2"><Label>Nombre</Label><Input name="firstName" defaultValue={profile?.firstName ?? ""} /></div>
          <div className="grid gap-2"><Label>Apellido</Label><Input name="lastName" defaultValue={profile?.lastName ?? ""} /></div>
          <div className="grid gap-2"><Label>Teléfono</Label><Input name="phone" defaultValue={profile?.phone ?? ""} /></div>
          <div className="grid gap-2">
            <Label>Título profesional</Label>
            <select name="title" defaultValue={profile?.title ?? ""} className="focus-ring h-14 w-full rounded-[14px] border border-slate-500/80 bg-[#fbfaf8] px-4 py-3 text-sm shadow-sm hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={professions.isLoading}>
              <option value="">{professions.isLoading ? "Cargando..." : "Seleccionar título"}</option>
              {titleOptions.map((title) => <option key={title} value={title}>{title}</option>)}
            </select>
            {professions.isError ? <p className="text-xs text-destructive">No se pudo cargar el catálogo de títulos. Puedes guardar los demás campos.</p> : null}
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label>Especialidad principal</Label>
            <select name="mainSpecialty" defaultValue={profile?.mainSpecialty ?? ""} className="focus-ring h-14 w-full rounded-[14px] border border-slate-500/80 bg-[#fbfaf8] px-4 py-3 text-sm shadow-sm hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={specialties.isLoading}>
              <option value="">{specialties.isLoading ? "Cargando..." : "Seleccionar especialidad"}</option>
              {specialtyOptions.map((specialty) => <option key={specialty} value={specialty}>{specialty}</option>)}
            </select>
            {specialties.isError ? <p className="text-xs text-destructive">No se pudo cargar el catálogo de especialidades. Puedes guardar los demás campos.</p> : null}
          </div>
          <div className="grid gap-2 md:col-span-2"><Label>Frase personal</Label><Input name="personalPhrase" defaultValue={profile?.personalPhrase ?? ""} /></div>
          <div className="grid gap-2 md:col-span-2"><Label>Bio</Label><Input name="bio" defaultValue={profile?.bio ?? ""} /></div>
          <p className="text-xs text-muted-foreground md:col-span-2">Solo se envían los campos con contenido; los vacíos no modifican el perfil.</p>
          {mutation.isError ? <p className="text-sm text-destructive md:col-span-2">{humanizeApiError(mutation.error)}</p> : null}
          <div className="md:col-span-2"><Button type="submit" title="Guardar cambios" aria-label="Guardar cambios" disabled={mutation.isPending}><IconButtonLabel icon={mutation.isPending ? "spinner" : "floppy-disk"} label={mutation.isPending ? "Guardando" : "Guardar cambios"} spin={mutation.isPending} /></Button></div>
        </form>
      </Modal>
    </>
  );
}

function AdminTherapistSchedulesAction({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const scheduleFormRef = useRef<HTMLFormElement>(null);
  const schedules = useQuery({
    queryKey: ["admin", "therapist-schedules", user.id],
    queryFn: () => listAdminTherapistSchedules(user.id),
    enabled: open
  });

  const createSchedule = useMutation({
    mutationFn: (input: TherapistScheduleInput) => createAdminTherapistSchedule(user.id, input),
    onSuccess: async () => {
      scheduleFormRef.current?.reset();
      await queryClient.invalidateQueries({ queryKey: ["admin", "therapist-schedules", user.id] });
    }
  });

  const deactivateSchedule = useMutation({
    mutationFn: (scheduleId: string) => deactivateAdminTherapistSchedule(user.id, scheduleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "therapist-schedules", user.id] });
    }
  });

  function onCreateSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const effectiveTo = String(form.get("effectiveTo") ?? "").trim();
    createSchedule.mutate({
      weekday: Number(form.get("weekday")),
      startTime: String(form.get("startTime") ?? ""),
      endTime: String(form.get("endTime") ?? ""),
      timezone: String(form.get("timezone") ?? browserTimezone()),
      effectiveFrom: String(form.get("effectiveFrom") ?? todayDate()),
      ...(effectiveTo ? { effectiveTo } : {})
    });
  }

  return (
    <>
      <Button size="icon" variant="outline" title="Horarios" aria-label="Horarios" onClick={() => setOpen(true)}><IconButtonLabel icon="calendar-days" label="Horarios" /></Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Horarios de ${user.name}`} description="Registra los horarios recurrentes que habilitan disponibilidad para booking.">
        <div className="grid gap-5">
          <form ref={scheduleFormRef} className="grid gap-4 md:grid-cols-3" onSubmit={onCreateSchedule}>
            <div className="grid gap-2">
              <Label>Día</Label>
              <select name="weekday" required className="focus-ring h-14 w-full rounded-[14px] border border-slate-500/80 bg-[#fbfaf8] px-4 py-3 text-sm shadow-sm hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                {WEEKDAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}
              </select>
            </div>
            <div className="grid gap-2"><Label>Inicio</Label><Input name="startTime" type="time" required /></div>
            <div className="grid gap-2"><Label>Fin</Label><Input name="endTime" type="time" required /></div>
            <div className="grid gap-2"><Label>Zona horaria</Label><Input name="timezone" defaultValue={browserTimezone()} required /></div>
            <div className="grid gap-2"><Label>Vigente desde</Label><Input name="effectiveFrom" type="date" defaultValue={todayDate()} required /></div>
            <div className="grid gap-2"><Label>Vigente hasta</Label><Input name="effectiveTo" type="date" /></div>
            {createSchedule.isError ? <p className="text-sm text-destructive md:col-span-3">{humanizeApiError(createSchedule.error)}</p> : null}
            {createSchedule.isSuccess ? <p className="text-sm text-emerald-700 md:col-span-3">Horario registrado correctamente.</p> : null}
            <div className="md:col-span-3"><Button type="submit" title="Registrar horario" aria-label="Registrar horario" disabled={createSchedule.isPending}><IconButtonLabel icon={createSchedule.isPending ? "spinner" : "plus"} label={createSchedule.isPending ? "Guardando" : "Registrar horario"} spin={createSchedule.isPending} /></Button></div>
          </form>

          {schedules.isLoading ? <LoadingState title="Cargando horarios" /> : null}
          {schedules.isError ? <ErrorState title="No se pudieron cargar los horarios" description={humanizeApiError(schedules.error)} actionLabel="Reintentar" onAction={() => void schedules.refetch()} /> : null}
          {schedules.data?.length ? (
            <DataTable<TherapistScheduleRow>
              data={schedules.data}
              getRowKey={(row) => row.id}
              columns={[
                { key: "weekday", header: "Día", render: (row) => row.weekdayLabel },
                { key: "time", header: "Horario", render: (row) => `${row.startTime} - ${row.endTime}` },
                { key: "timezone", header: "Zona", render: (row) => row.timezone },
                { key: "effective", header: "Vigencia", render: (row) => `${row.effectiveFrom}${row.effectiveTo ? ` a ${row.effectiveTo}` : ""}` },
                { key: "status", header: "Estado", render: (row) => <Badge variant={row.status === "ACTIVE" ? "success" : "muted"}>{row.status}</Badge> },
                { key: "actions", header: "Acciones", render: (row) => row.status === "ACTIVE" ? <Button size="icon" variant="outline" title="Desactivar horario" aria-label="Desactivar horario" disabled={deactivateSchedule.isPending} onClick={() => deactivateSchedule.mutate(row.id)}><IconButtonLabel icon={deactivateSchedule.isPending ? "spinner" : "ban"} label="Desactivar horario" spin={deactivateSchedule.isPending} /></Button> : null }
              ]}
            />
          ) : schedules.isSuccess ? <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Este terapeuta todavía no tiene horarios. Registra al menos uno para que el booking muestre disponibilidad.</p> : null}
          {deactivateSchedule.isError ? <p className="text-sm text-destructive">{humanizeApiError(deactivateSchedule.error)}</p> : null}
        </div>
      </Modal>
    </>
  );
}

function UploadPhotoAction({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const mutation = useMutation({
    mutationFn: (file: File) => uploadUserPhotoByAdmin(user.id, file),
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
      <Button size="icon" variant="outline" title="Subir foto" aria-label="Subir foto" disabled={mutation.isPending} onClick={() => inputRef.current?.click()}>
        <IconButtonLabel icon={mutation.isPending ? "spinner" : "upload"} label={mutation.isPending ? "Subiendo foto" : "Subir foto"} spin={mutation.isPending} />
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
            size="icon"
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(action.value)}
            title={action.label}
            aria-label={action.label}
          >
            <IconButtonLabel icon={mutation.isPending ? "spinner" : statusIcon(action.value)} label={action.label} spin={mutation.isPending} />
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
      <form className="animate-fade-in grid gap-4 rounded-2xl border bg-card p-6 shadow-sm md:grid-cols-2" onSubmit={onCreateUser}>
        <div className="md:col-span-2">
          <h2 className="text-lg font-bold">Crear usuario</h2>
          <p className="mt-1 text-sm text-muted-foreground">El servidor actual permite registrar pacientes y terapeutas. Los roles administrativos requieren endpoint dedicado.</p>
        </div>
        <div className="grid gap-2">
          <Label>Rol</Label>
          <select className="focus-ring h-14 w-full rounded-[14px] border border-slate-500/80 bg-[#fbfaf8] px-4 py-3 text-sm shadow-sm hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50" value={role} onChange={(event) => setRole(event.target.value as CreateUserInput["role"])}>
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
              <select name="title" required className="focus-ring h-14 w-full rounded-[14px] border border-slate-500/80 bg-[#fbfaf8] px-4 py-3 text-sm shadow-sm hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={professions.isLoading}>
                <option value="">{professions.isLoading ? "Cargando..." : "Seleccionar titulo"}</option>
                {professions.data?.map((title) => <option key={title} value={title}>{title}</option>)}
              </select>
              {professions.isError ? <p className="text-xs text-destructive">No se pudo cargar el catálogo de títulos.</p> : null}
            </div>
            <div className="grid gap-2">
              <Label>Especialidad principal</Label>
              <select name="mainSpecialty" required className="focus-ring h-14 w-full rounded-[14px] border border-slate-500/80 bg-[#fbfaf8] px-4 py-3 text-sm shadow-sm hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={specialties.isLoading}>
                <option value="">{specialties.isLoading ? "Cargando..." : "Seleccionar especialidad"}</option>
                {specialties.data?.map((specialty) => <option key={specialty} value={specialty}>{specialty}</option>)}
              </select>
              {specialties.isError ? <p className="text-xs text-destructive">No se pudo cargar el catálogo de especialidades.</p> : null}
            </div>
            <div className="grid gap-2 md:col-span-2"><Label>Bio</Label><Input name="bio" /></div>
          </>
        ) : null}
        {createMutation.isError ? <p className="text-sm text-destructive md:col-span-2">{humanizeApiError(createMutation.error)}</p> : null}
        {createMutation.isSuccess ? <p className="text-sm text-emerald-700 md:col-span-2">Usuario enviado al servidor correctamente.</p> : null}
        <div className="md:col-span-2"><Button disabled={createMutation.isPending} type="submit" title="Crear usuario" aria-label="Crear usuario"><IconButtonLabel icon={createMutation.isPending ? "spinner" : "plus"} label={createMutation.isPending ? "Creando usuario" : "Crear usuario"} spin={createMutation.isPending} /></Button></div>
      </form>

      <TableShell
        filters={
          <>
            <div className="relative flex-1 min-w-48">
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
                    <UploadPhotoAction user={row} />
                    {row.role === "TERAPEUTA" ? <><EditTherapistAction user={row} /><AdminTherapistSchedulesAction user={row} /></> : null}
                    <StatusActions user={row} />
                  </div>
                ) }
            ]}
          />
        ) : null}
      </TableShell>
    </div>
  );
}

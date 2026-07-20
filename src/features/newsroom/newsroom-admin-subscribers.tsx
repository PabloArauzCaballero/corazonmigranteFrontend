"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock3, Users, XCircle } from "lucide-react";
import { newsroomApi } from "@/features/newsroom/newsroom.api";
import { listPatients } from "@/features/users/users.api";
import type { ContentSubscriber } from "@/features/newsroom/newsroom.types";
import type { AdminUser } from "@/features/users/users.types";
import { Field, fmtDate, fstr, isoLocal, NativeInput, Notice, Panel, Select, StatusBadge, Submit, useNotice } from "@/features/newsroom/admin-kit";
import { humanizeApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable } from "@/shared/ui/data-table";
import { ErrorState, LoadingState } from "@/shared/ui/state";

export function SubscribersAdmin() {
  const qc = useQueryClient();
  const notice = useNotice();
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<AdminUser | null>(null);
  const query = useQuery({ queryKey: ["newsroom-subscribers"], queryFn: () => newsroomApi.subscribers({ page: 1, pageSize: 50 }) });
  const patients = useQuery({ queryKey: ["content-subscriber-patients", patientSearch], queryFn: () => listPatients({ search: patientSearch, page: 1, pageSize: 10 }), enabled: !selectedPatient });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["newsroom-subscribers"] });

  const mutation = useMutation({
    mutationFn: async (form: FormData) => {
      notice.clear();
      if (!selectedPatient) throw new Error("Selecciona primero un usuario paciente.");
      return newsroomApi.upsertSubscriber({ userId: selectedPatient.id, email: selectedPatient.email, displayName: selectedPatient.name, status: fstr(form, "status") || "ACTIVE", subscriptionTier: fstr(form, "subscriptionTier") || "FREE", premiumUntil: isoLocal(fstr(form, "premiumUntil")), source: "admin" });
    },
    onSuccess: () => { notice.ok("Paciente suscriptor guardado."); setSelectedPatient(null); setPatientSearch(""); refresh(); },
    onError: notice.fail
  });

  const toggleTier = useMutation({
    mutationFn: (subscriber: ContentSubscriber) => newsroomApi.updateSubscriberByUser(subscriber.userId ?? subscriber.id, { subscriptionTier: subscriber.subscriptionTier === "PREMIUM" ? "FREE" : "PREMIUM", status: "ACTIVE", source: "admin" }),
    onSuccess: refresh, onError: notice.fail
  });

  const approveRequest = useMutation({
    mutationFn: (subscriber: ContentSubscriber) => newsroomApi.approveSubscriberRequest(subscriber.userId ?? subscriber.id),
    onSuccess: refresh, onError: notice.fail
  });

  const rejectRequest = useMutation({
    mutationFn: (subscriber: ContentSubscriber) => newsroomApi.rejectSubscriberRequest(subscriber.userId ?? subscriber.id),
    onSuccess: refresh, onError: notice.fail
  });

  const pendingRequests = (query.data?.items ?? []).filter((subscriber) => subscriber.status === "PENDING");

  return (
    <div className="grid gap-6">
      {pendingRequests.length > 0 ? (
        <Panel title="Solicitudes de suscripción premium" description="Estos pacientes pidieron acceso al contenido premium." icon={<Clock3 className="h-5 w-5" />}>
          <DataTable<ContentSubscriber>
            data={pendingRequests}
            getRowKey={(r) => r.id}
            columns={[
              { key: "email", header: "Paciente", render: (r) => <div><b>{r.displayName || r.email}</b>{r.displayName ? <p className="text-xs text-muted-foreground">{r.email}</p> : null}</div> },
              { key: "requestedAt", header: "Solicitado", render: (r) => fmtDate((r.metadata?.requestedPremiumAt as string) ?? r.updatedAt) },
              { key: "actions", header: "Acciones", render: (r) => <div className="flex gap-2"><Button size="sm" disabled={approveRequest.isPending} onClick={() => approveRequest.mutate(r)}><CheckCircle2 className="h-4 w-4" />Aprobar</Button><Button size="sm" variant="outline" disabled={rejectRequest.isPending} onClick={() => rejectRequest.mutate(r)}><XCircle className="h-4 w-4" />Rechazar</Button></div> }
            ]}
          />
        </Panel>
      ) : null}

      <Panel title="Registrar paciente suscriptor" description="Los suscriptores premium se vinculan a usuarios pacientes existentes." icon={<Users className="h-5 w-5" />}>
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
                    <button key={patient.id} type="button" className="rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:border-primary hover:text-primary" onClick={() => { setSelectedPatient(patient); setPatientSearch(""); }}>
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

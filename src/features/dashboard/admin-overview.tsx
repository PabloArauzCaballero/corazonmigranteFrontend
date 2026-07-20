"use client";

import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CalendarCheck, CalendarClock, Check, Clock, Users } from "lucide-react";
import Link from "next/link";
import { listAppointmentRequests, mapAppointmentRequest, updateAdminAppointment } from "@/features/therapy/therapy.api";
import { listUsers } from "@/features/users/users.api";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

function KpiCard({
  label,
  value,
  description,
  icon: Icon,
  urgent = false,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ElementType;
  urgent?: boolean;
}) {
  return (
    <Card className={urgent ? "border-amber-300 bg-amber-50" : ""}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className={`mt-1 text-3xl font-black ${urgent ? "text-amber-700" : ""}`}>{value}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
          </div>
          <span className={`mt-0.5 shrink-0 rounded-xl p-2 ${urgent ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"}`}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function PendingAppointmentRow({ item }: { item: ReturnType<typeof mapAppointmentRequest> }) {
  const qc = useQueryClient();
  const confirm = useMutation({
    mutationFn: () => updateAdminAppointment(item.id, { status: "CONFIRMED" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="truncate font-semibold text-sm">{item.patient}</p>
        <p className="truncate text-xs text-muted-foreground">{item.service} · {item.date}{item.time !== "—" ? ` ${item.time}` : ""}</p>
      </div>
      <Button
        size="sm"
        disabled={confirm.isPending}
        onClick={() => confirm.mutate()}
        className="shrink-0"
      >
        <Check className="h-3.5 w-3.5" /> Confirmar
      </Button>
    </div>
  );
}

function statValue(data: { total: number } | undefined, isError: boolean) {
  if (isError) return "Error";
  if (!data) return "...";
  return String(data.total);
}

export function AdminOverview() {
  const [pending, confirmed, users] = useQueries({
    queries: [
      {
        queryKey: ["dashboard", "pending"],
        queryFn: () => listAppointmentRequests({ page: 1, pageSize: 5, status: "REQUESTED" }),
      },
      {
        queryKey: ["dashboard", "confirmed"],
        queryFn: () => listAppointmentRequests({ page: 1, pageSize: 1, status: "CONFIRMED" }),
      },
      {
        queryKey: ["dashboard", "users"],
        queryFn: () => listUsers({ page: 1, pageSize: 1 }),
      },
    ],
  });

  const pendingCount = statValue(pending.data, pending.isError);
  const hasPending = !pending.isError && (pending.data?.total ?? 0) > 0;

  return (
    <div className="grid gap-6">
      <div className="grid gap-5 md:grid-cols-3">
        <KpiCard
          label="Pendientes de confirmación"
          value={pendingCount}
          description={hasPending ? "Citas que esperan tu acción ahora mismo." : "Sin citas pendientes. ¡Al día!"}
          icon={Clock}
          urgent={hasPending}
        />
        <KpiCard
          label="Citas confirmadas (total)"
          value={statValue(confirmed.data, confirmed.isError)}
          description="Confirmadas en el sistema."
          icon={CalendarCheck}
        />
        <KpiCard
          label="Usuarios registrados"
          value={statValue(users.data, users.isError)}
          description="Pacientes, terapeutas y administradores."
          icon={Users}
        />
      </div>

      {hasPending && pending.data && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-amber-900">
                {pending.data.total} cita{pending.data.total !== 1 ? "s" : ""} esperando confirmación
              </h3>
            </div>
            <Button asChild size="sm" variant="outline" className="border-amber-300 bg-white text-amber-800 hover:bg-amber-100">
              <Link href="/admin/solicitudes?status=REQUESTED">Ver todas</Link>
            </Button>
          </div>
          <div className="grid gap-2">
            {pending.data.items.slice(0, 5).map((item) => (
              <PendingAppointmentRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

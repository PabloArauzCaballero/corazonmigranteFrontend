"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { listNotifications, markAllRead, markNotificationRead, type AdminNotification, type NotificationsListResponse } from "@/features/notifications/notifications.api";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";
import { DataTableSkeleton } from "@/shared/ui/data-table";

const TYPE_LABELS: Record<string, string> = {
  APPOINTMENT_REQUESTED: "Nueva solicitud de cita",
  APPOINTMENT_CONFIRMED: "Cita confirmada",
  APPOINTMENT_CANCELLED: "Cita cancelada",
  APPOINTMENT_COMPLETED: "Cita completada",
  APPOINTMENT_NO_SHOW: "Paciente no se presentó",
  USER_REGISTERED: "Nuevo usuario registrado",
};

type BadgeVariant = "default" | "secondary" | "muted" | "success" | "warning" | "danger";

const TYPE_BADGE: Record<string, BadgeVariant> = {
  APPOINTMENT_REQUESTED: "warning",
  APPOINTMENT_CONFIRMED: "success",
  APPOINTMENT_CANCELLED: "danger",
  APPOINTMENT_COMPLETED: "success",
  APPOINTMENT_NO_SHOW: "danger",
  USER_REGISTERED: "secondary",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString("es-BO", { dateStyle: "medium", timeStyle: "short" });
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora mismo";
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  return formatDate(dateStr);
}

export default function NotificationsPage() {
  const [data, setData] = useState<NotificationsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const load = useCallback(async (p: number, unread: boolean) => {
    setLoading(true);
    try {
      const result = await listNotifications({ page: p, unreadOnly: unread });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(page, unreadOnly); }, [load, page, unreadOnly]);

  async function handleMarkRead(id: string) {
    setMarkingId(id);
    try {
      await markNotificationRead(id);
      setData((prev) => prev
        ? { ...prev, items: prev.items.map((n) => n.id === id ? { ...n, isRead: true } : n) }
        : prev
      );
    } finally {
      setMarkingId(null);
    }
  }

  async function handleMarkAll() {
    setMarkingAll(true);
    try {
      await markAllRead();
      await load(page, unreadOnly);
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = (data?.items ?? []).filter((n) => !n.isRead).length;
  const totalPages = data?.pagination.totalPages ?? 1;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Notificaciones"
        description="Eventos importantes del sistema: nuevas citas, cambios de estado, registros de usuarios y más."
      />

      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 rounded-xl border bg-card p-1">
          <Button
            onClick={() => { setUnreadOnly(false); setPage(1); }}
            size="sm"
            variant={unreadOnly ? "ghost" : "default"}
            className="rounded-lg"
          >
            Todas
          </Button>
          <Button
            onClick={() => { setUnreadOnly(true); setPage(1); }}
            size="sm"
            variant={unreadOnly ? "default" : "ghost"}
            className="rounded-lg"
          >
            Solo no leídas
            {unreadCount > 0 && !unreadOnly && (
              <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white leading-none">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>
        {unreadCount > 0 && (
          <Button
            loading={markingAll}
            onClick={() => void handleMarkAll()}
            size="sm"
            variant="outline"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todo como leído
          </Button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <DataTableSkeleton columns={3} rows={6} />
      ) : !data || data.items.length === 0 ? (
        <Card className="animate-fade-in">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-muted-foreground">
            <Bell className="h-10 w-10 opacity-30" />
            <p className="text-sm">No hay notificaciones{unreadOnly ? " no leídas" : ""}.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {data.items.map((n: AdminNotification, i) => (
            <div
              key={n.id}
              className={`animate-fade-in flex items-start justify-between gap-4 rounded-2xl border p-5 transition-all duration-200 ${
                n.isRead ? "bg-card opacity-70" : "border-primary/30 bg-primary/5 shadow-sm"
              }`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  {!n.isRead && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="No leída" />
                  )}
                  <span className={`text-sm font-semibold ${n.isRead ? "text-muted-foreground" : "text-foreground"}`}>
                    {TYPE_LABELS[n.type] ?? n.type}
                  </span>
                  <Badge variant={TYPE_BADGE[n.type] ?? "muted"}>
                    {n.type.replace(/_/g, " ").toLowerCase()}
                  </Badge>
                </div>
                {n.entityType && (
                  <p className="text-xs text-muted-foreground">{n.entityType}</p>
                )}
                <p className="text-xs text-muted-foreground">{formatRelative(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <Button
                  loading={markingId === n.id}
                  onClick={() => void handleMarkRead(n.id)}
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                >
                  Leída
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 animate-fade-in">
          <Button
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
            size="sm"
            variant="outline"
            className="gap-1 hover:-translate-x-0.5"
          >
            <ChevronLeft className="h-4 w-4" /> Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página <strong>{page}</strong> de <strong>{totalPages}</strong>
          </span>
          <Button
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            size="sm"
            variant="outline"
            className="gap-1 hover:translate-x-0.5"
          >
            Siguiente <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

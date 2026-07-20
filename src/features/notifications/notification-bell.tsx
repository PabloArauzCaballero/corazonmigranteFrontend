"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { useAdminNotifications } from "./use-admin-notifications";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

const TYPE_LABELS: Record<string, string> = {
  APPOINTMENT_REQUESTED: "Nueva solicitud de cita",
  APPOINTMENT_CONFIRMED: "Cita confirmada",
  APPOINTMENT_CANCELLED: "Cita cancelada",
  APPOINTMENT_COMPLETED: "Cita completada",
  APPOINTMENT_NO_SHOW: "Paciente no se presentó",
  USER_REGISTERED: "Nuevo usuario registrado",
};

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Ahora mismo";
  if (mins < 60) return `Hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Hace ${hrs} h`;
  return `Hace ${Math.floor(hrs / 24)} d`;
}

export function NotificationBell() {
  const { unreadCount, recent, markRead, markAll, hasNew, clearNew } = useAdminNotifications();
  const [open, setOpen] = useState(false);
  const [badgeKey, setBadgeKey] = useState(0); // re-mount triggers animation
  const containerRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(unreadCount);

  // Animate badge when count increases
  useEffect(() => {
    if (unreadCount > prevCountRef.current) {
      setBadgeKey((k) => k + 1);
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount]);

  // Clear "hasNew" glow when user opens panel
  useEffect(() => {
    if (open && hasNew) clearNew();
  }, [open, hasNew, clearNew]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell button */}
      <button
        type="button"
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl transition-[background-color,box-shadow] duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${hasNew ? "animate-ring-pulse" : ""}`}
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className={`h-5 w-5 transition-transform duration-200 ${open ? "scale-90" : "scale-100"}`} />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            key={badgeKey}
            className="animate-badge-pop absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm"
            aria-hidden="true"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        {/* New-event pulse ring */}
        {hasNew && (
          <span className="absolute inset-0 rounded-xl ring-2 ring-primary/40 animate-ping" aria-hidden="true" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="animate-slide-down absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border bg-card shadow-xl"
          role="dialog"
          aria-label="Panel de notificaciones"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-semibold">Notificaciones</span>
            {unreadCount > 0 && (
              <button
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
                onClick={() => { void markAll(); }}
                type="button"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar todo leído
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 divide-y overflow-y-auto overscroll-contain">
            {recent.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <Bell className="h-7 w-7 text-muted-foreground/40" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Sin notificaciones recientes</p>
              </div>
            ) : (
              recent.map((n, i) => (
                <button
                  className="group w-full px-4 py-3 text-left transition-colors hover:bg-muted/60"
                  key={n.id}
                  style={{ animationDelay: `${i * 30}ms` }}
                  onClick={() => { if (!n.isRead) void markRead(n.id); }}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm font-medium leading-snug ${n.isRead ? "text-muted-foreground" : "text-foreground"}`}>
                      {TYPE_LABELS[n.type] ?? n.type}
                    </span>
                    {!n.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="No leída" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{formatRelative(n.createdAt)}</span>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t bg-muted/30 px-4 py-3">
            <Link
              href="/admin/notificaciones"
              className="flex items-center justify-center gap-1 text-xs font-medium text-primary transition hover:underline"
              onClick={() => setOpen(false)}
            >
              Ver todas las notificaciones <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

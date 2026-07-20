"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readClientSession } from "@/shared/auth/cookies";
import { env } from "@/config/env";
import { useToast } from "@/shared/ui/toast";
import { getUnreadCount, markAllRead, markNotificationRead, type AdminNotification } from "./notifications.api";

const TYPE_LABELS: Record<string, string> = {
  APPOINTMENT_REQUESTED: "Nueva solicitud de cita",
  APPOINTMENT_CONFIRMED: "Cita confirmada",
  APPOINTMENT_CANCELLED: "Cita cancelada",
  APPOINTMENT_COMPLETED: "Cita completada",
  APPOINTMENT_NO_SHOW: "Paciente no se presentó",
  USER_REGISTERED: "Nuevo usuario registrado",
};

const TYPE_VARIANT: Record<string, "info" | "success" | "warning" | "danger"> = {
  APPOINTMENT_REQUESTED: "warning",
  APPOINTMENT_CONFIRMED: "success",
  APPOINTMENT_CANCELLED: "danger",
  APPOINTMENT_COMPLETED: "success",
  APPOINTMENT_NO_SHOW: "danger",
  USER_REGISTERED: "info",
};

function buildSseUrl(): string | null {
  const baseUrl = env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) return null;
  const clean = baseUrl.replace(/\/+$/, "").replace(/\/(api\/v1|api)$/i, "");
  return `${clean}/api/v1/admin/notifications/stream`;
}

export function useAdminNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState<AdminNotification[]>([]);
  const [hasNew, setHasNew] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const toast = useToast();

  const refreshCount = useCallback(async () => {
    try {
      const { unreadCount: count } = await getUnreadCount();
      setUnreadCount(count);
    } catch {
      // silent — badge is non-critical
    }
  }, []);

  // Connect SSE for real-time push
  useEffect(() => {
    const sseUrl = buildSseUrl();
    if (!sseUrl) return;

    const session = readClientSession();
    const token = session?.token;
    if (!token) return;

    const url = `${sseUrl}?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data as string) as AdminNotification;
        setUnreadCount((n) => n + 1);
        setRecent((prev) => [event, ...prev].slice(0, 10));
        setHasNew(true);
        // Fire toast
        toast({
          title: TYPE_LABELS[event.type] ?? event.type,
          variant: TYPE_VARIANT[event.type] ?? "info",
          description: event.payload
            ? Object.values(event.payload as Record<string, string>).slice(0, 1)[0]
            : undefined,
        });
      } catch {
        // malformed event — ignore
      }
    };

    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [toast]);

  // Initial count load
  useEffect(() => {
    void refreshCount();
  }, [refreshCount]);

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id);
    setRecent((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAll = useCallback(async () => {
    await markAllRead();
    setRecent((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const clearNew = useCallback(() => setHasNew(false), []);

  return { unreadCount, recent, markRead, markAll, refreshCount, hasNew, clearNew };
}

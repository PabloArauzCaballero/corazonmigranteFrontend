"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { readClientSession } from "@/shared/auth/cookies";
import { ENDPOINTS } from "@/shared/api/endpoints";
import { env } from "@/config/env";
import { useToast } from "@/shared/ui/toast";
import { ATTR, TECHNICAL_SPANS, startSpan } from "@/observability";
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
  // Misma normalización que `apiBaseUrl()` en client.ts: la ruta de ENDPOINTS ya
  // incluye /api/v1, así que se recorta el sufijo si la variable lo trae.
  const clean = baseUrl.replace(/\/+$/, "").replace(/\/(api\/v1|api)$/i, "");
  return `${clean}${ENDPOINTS.notifications.stream}`;
}

const UNREAD_COUNT_KEY = ["admin-unread-count"] as const;

export function useAdminNotifications() {
  const queryClient = useQueryClient();
  const [recent, setRecent] = useState<AdminNotification[]>([]);
  const [hasNew, setHasNew] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const toast = useToast();

  // El contador vive en React Query en vez de en useState + useEffect de carga
  // inicial: así se comparte entre la campana del escritorio y la del móvil (que
  // antes hacían dos peticiones), y desaparece el render en cascada del efecto.
  // El badge no es crítico: si la petición falla se muestra 0 en silencio.
  const countQuery = useQuery({
    queryKey: UNREAD_COUNT_KEY,
    queryFn: getUnreadCount,
    retry: false,
    staleTime: 30_000,
  });
  const unreadCount = countQuery.data?.unreadCount ?? 0;

  const setUnreadCount = useCallback(
    (update: (current: number) => number) => {
      queryClient.setQueryData<{ unreadCount: number }>(UNREAD_COUNT_KEY, (previous) => ({
        unreadCount: Math.max(0, update(previous?.unreadCount ?? 0)),
      }));
    },
    [queryClient]
  );

  const refreshCount = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: UNREAD_COUNT_KEY });
  }, [queryClient]);

  // Connect SSE for real-time push
  useEffect(() => {
    const sseUrl = buildSseUrl();
    if (!sseUrl) return;

    const session = readClientSession();
    const token = session?.token;
    if (!token) return;

    const url = `${sseUrl}?token=${encodeURIComponent(token)}`;

    // ⚠️ `url` lleva el JWT en la query string. NUNCA puede entrar en un atributo de
    // span. Por eso el span de conexión no registra ninguna URL: solo el hecho de que
    // se abrió el stream. (`sanitizeUrlPath` volvería a quitarlo si se colara, pero la
    // primera defensa es no escribirlo.)
    const connectSpan = startSpan(TECHNICAL_SPANS.sseConnect, {
      [ATTR.feature]: "notifications",
      [ATTR.operation]: "stream-open"
    });

    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => {
      connectSpan.setAttribute(ATTR.uiResult, "success");
      connectSpan.end();
    };

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data as string) as AdminNotification;

        // Un span corto por mensaje recibido. El `payload` NO se toca: puede contener
        // el nombre de un paciente o el detalle de una cita. `event.type` es un valor
        // de un conjunto cerrado de seis, así que no genera cardinalidad.
        startSpan(TECHNICAL_SPANS.sseMessage, {
          [ATTR.feature]: "notifications",
          [ATTR.operation]: "stream-message",
          [ATTR.networkRequestType]: "api"
        }).end();

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
      // `EventSource` no expone el motivo del fallo, así que solo se registra el
      // resultado. El span se cierra aquí si nunca llegó a abrirse.
      connectSpan.setAttribute(ATTR.uiResult, "error");
      connectSpan.end();
      es.close();
    };

    return () => {
      // Si el efecto se limpia antes de que el stream abriera o fallara, el span se
      // cierra igualmente: ningún span puede quedarse vivo indefinidamente.
      connectSpan.end();
      es.close();
      esRef.current = null;
    };
  }, [toast, setUnreadCount]);

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id);
    setRecent((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount((c) => c - 1);
  }, [setUnreadCount]);

  const markAll = useCallback(async () => {
    await markAllRead();
    setRecent((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(() => 0);
  }, [setUnreadCount]);

  const clearNew = useCallback(() => setHasNew(false), []);

  return { unreadCount, recent, markRead, markAll, refreshCount, hasNew, clearNew };
}

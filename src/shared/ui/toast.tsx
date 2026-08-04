"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle, Info, TriangleAlert, X, XCircle } from "lucide-react";

export type ToastVariant = "info" | "success" | "warning" | "danger";

export type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  toast: (t: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 6000;

function ToastItem({ item, onDismiss }: { item: Toast; onDismiss: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(item.id), 220);
  }, [item.id, onDismiss]);

  // El auto-cierre se detiene mientras el puntero o el foco están sobre el aviso.
  // WCAG 2.2.1 (Timing Adjustable): un mensaje que desaparece solo debe poder
  // pausarse; además evitaba leer avisos largos o pulsar su enlace a tiempo.
  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [dismiss, paused]);

  const icons: Record<ToastVariant, typeof Info> = {
    info: Info,
    success: CheckCircle,
    warning: TriangleAlert,
    danger: XCircle,
  };
  // Trío `*-border` / `*-surface` / `*` del sistema de diseño. Antes eran paletas
  // crudas de Tailwind (`emerald-50`, `amber-300`…), que no respondían a ningún
  // token y quedaban en claro sobre el tema oscuro.
  const colors: Record<ToastVariant, string> = {
    info:    "border-info-border        bg-info-surface        text-info",
    success: "border-success-border     bg-success-surface     text-success",
    warning: "border-warning-border     bg-warning-surface     text-warning",
    danger:  "border-destructive-border bg-destructive-surface text-destructive",
  };

  const variant = item.variant ?? "info";
  const Icon = icons[variant];
  // Solo los avisos de error interrumpen al lector de pantalla; el resto se anuncian
  // cuando la persona termina lo que esté leyendo.
  const isUrgent = variant === "danger" || variant === "warning";

  return (
    <div
      className={`pointer-events-auto flex w-[min(20rem,calc(100vw-3rem))] items-start gap-3 rounded-2xl border p-4 shadow-lg ${colors[variant]} ${exiting ? "animate-toast-out" : "animate-toast-in"}`}
      role={isUrgent ? "alert" : "status"}
      aria-live={isUrgent ? "assertive" : "polite"}
      aria-atomic="true"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug">{item.title}</p>
        {item.description && <p className="mt-0.5 text-xs opacity-80 leading-relaxed">{item.description}</p>}
      </div>
      <button
        type="button"
        className="focus-ring ml-1 shrink-0 rounded-lg p-0.5 opacity-60 hover:opacity-100"
        onClick={dismiss}
        aria-label={`Cerrar aviso: ${item.title}`}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-4), { ...t, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* `aria-label` sobre un <div> sin rol lo ignoran los lectores de pantalla;
          hace falta un `role` de landmark para que la región tenga nombre. */}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-toast flex flex-col-reverse gap-2 sm:bottom-6 sm:right-6"
        role="region"
        aria-label="Notificaciones del sistema"
      >
        {toasts.map((item) => (
          <ToastItem key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx.toast;
}

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

function ToastItem({ item, onDismiss }: { item: Toast; onDismiss: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(item.id), 220);
  }, [item.id, onDismiss]);

  useEffect(() => {
    timerRef.current = setTimeout(dismiss, 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [dismiss]);

  const icons: Record<ToastVariant, typeof Info> = {
    info: Info,
    success: CheckCircle,
    warning: TriangleAlert,
    danger: XCircle,
  };
  const colors: Record<ToastVariant, string> = {
    info:    "border-primary/30    bg-primary/10    text-primary",
    success: "border-emerald-300   bg-emerald-50   text-emerald-800",
    warning: "border-amber-300     bg-amber-50     text-amber-800",
    danger:  "border-red-300       bg-red-50       text-red-800",
  };

  const variant = item.variant ?? "info";
  const Icon = icons[variant];

  return (
    <div
      className={`pointer-events-auto flex w-80 items-start gap-3 rounded-2xl border p-4 shadow-lg ${colors[variant]} ${exiting ? "animate-toast-out" : "animate-toast-in"}`}
      role="alert"
      aria-live="assertive"
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug">{item.title}</p>
        {item.description && <p className="mt-0.5 text-xs opacity-80 leading-relaxed">{item.description}</p>}
      </div>
      <button
        type="button"
        className="ml-1 shrink-0 rounded-lg p-0.5 opacity-60 hover:opacity-100 focus-visible:outline-none"
        onClick={dismiss}
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
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
      <div
        className="pointer-events-none fixed bottom-6 right-6 z-[200] flex flex-col-reverse gap-2"
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

"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Modal } from "@/shared/ui/modal";
import { Button } from "@/shared/ui/button";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** danger = acción destructiva (rojo + icono de basura). */
  variant?: "danger" | "default";
};

type ConfirmContextValue = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [pending, setPending] = useState(false);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmContextValue>((opts) => {
    setOptions(opts);
    setOpen(true);
    setPending(false);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpen(false);
  }, []);

  const isDanger = options?.variant === "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {/* La descripción NO se pasa al Modal: se pinta aquí abajo junto al icono. Si se
          pasa además como prop, el mismo texto aparece dos veces en el diálogo. */}
      <Modal
        open={open}
        onClose={() => settle(false)}
        title={options?.title ?? "¿Confirmar acción?"}
      >
        <div className="flex items-start gap-3">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${isDanger ? "bg-red-100 text-red-600" : "bg-primary/10 text-primary"}`}>
            {isDanger ? <Trash2 className="h-5 w-5" aria-hidden="true" /> : <AlertTriangle className="h-5 w-5" aria-hidden="true" />}
          </span>
          <p className="pt-1 text-sm leading-6 text-muted-foreground">
            {options?.description ?? "Esta acción no se puede deshacer. ¿Deseas continuar?"}
          </p>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => settle(false)} disabled={pending}>
            {options?.cancelLabel ?? "Cancelar"}
          </Button>
          <Button
            type="button"
            onClick={() => settle(true)}
            disabled={pending}
            className={isDanger ? "bg-red-600 text-surface-inverse-foreground hover:bg-red-700" : ""}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : isDanger ? <Trash2 className="h-4 w-4" aria-hidden="true" /> : null}
            {options?.confirmLabel ?? (isDanger ? "Eliminar" : "Confirmar")}
          </Button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

/** Hook global: `const confirm = useConfirm(); if (await confirm({...})) { ... }` */
export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm debe usarse dentro de <ConfirmProvider>");
  return ctx;
}

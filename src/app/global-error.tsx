"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#f7f4ef] p-6 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Ocurrió un error inesperado</h1>
            <p className="max-w-md text-sm text-slate-500">
              Lo sentimos, algo salió mal. Por favor intenta de nuevo o recarga la página.
              {error.digest ? (
                <span className="mt-1 block font-mono text-xs text-slate-400">
                  ID: {error.digest}
                </span>
              ) : null}
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={reset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Intentar de nuevo
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">Ir al inicio</Link>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}

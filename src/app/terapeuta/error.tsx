"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";

export default function SectionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[SectionError]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-md border-red-200 bg-red-50">
        <CardContent className="flex flex-col items-center gap-5 py-10 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-100">
            <AlertTriangle className="h-7 w-7 text-red-600" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">Error al cargar la sección</h2>
            <p className="text-sm text-slate-500">
              No se pudo cargar esta parte de la aplicación. Puedes intentar de nuevo o volver al
              inicio.
            </p>
            {error.digest ? (
              <p className="font-mono text-xs text-slate-400">ID: {error.digest}</p>
            ) : null}
          </div>
          <div className="flex gap-3">
            <Button size="sm" onClick={reset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Intentar de nuevo
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/">Inicio</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

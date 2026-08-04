"use client";

import Link from "next/link";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { loadConfiguredPublicLanding } from "@/features/public-view/public-view.api";
import { PublicLandingPage } from "@/features/public-view/public-landing-page";
import type { PublicViewLoadResult } from "@/features/public-view/public-view.types";
import { Button } from "@/shared/ui/button";

function PublicLandingLoading() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 text-ink">
      {/* `max-w-full` + `min-w-0`: el aviso es una fila que no encogía, de modo que a
          320 px su ancho mínimo (icono + hueco + texto + relleno) superaba el de la
          pantalla y desbordaba la página. Es la primera pantalla que se ve mientras
          responde el backend, así que el defecto era plenamente visible. */}
      <div className="flex max-w-full items-center gap-3 rounded-2xl border border-line bg-card/86 px-4 py-3.5 text-sm font-semibold shadow-[0_20px_60px_rgba(43,27,23,0.08)] sm:px-5 sm:py-4">
        <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary" aria-hidden="true" />
        <span className="min-w-0">Cargando pagina principal...</span>
      </div>
    </main>
  );
}

function PublicViewError({
  message,
  endpoint,
  status,
  onRetry,
}: {
  message: string;
  endpoint: string;
  status?: number;
  onRetry: () => void;
}) {
  return (
    <main className="min-h-dvh bg-background px-4 py-8 text-ink sm:py-10">
      <section className="mx-auto grid min-h-[calc(100dvh-5rem)] max-w-4xl place-items-center">
        <div className="w-full rounded-[1.75rem] border border-amber-200 bg-card/86 p-5 shadow-[0_30px_90px_rgba(43,27,23,0.10)] backdrop-blur sm:rounded-[2.25rem] sm:p-8 md:p-10">
          {/* En móvil el icono pasa a estar encima del texto: en fila, junto a un
              titular grande, dejaba una columna de texto demasiado estrecha. */}
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700 sm:h-12 sm:w-12">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </span>
            {/* `min-w-0`: sin él el titular no puede partirse y ensancha la tarjeta. */}
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700 sm:text-sm sm:tracking-[0.22em]">
                Pagina no disponible
              </p>
              <h1 className="mt-3 break-words text-2xl font-black tracking-tight sm:text-3xl md:text-5xl">
                No se pudo cargar la pagina principal.
              </h1>
              <p className="mt-5 text-base leading-7 text-ink-muted">
                {message || "La configuracion publica no esta disponible en este momento."}
              </p>
              {process.env.NODE_ENV !== "production" && status ? (
                <p className="mt-3 text-sm font-semibold text-ink-muted">
                  HTTP {status}
                </p>
              ) : null}
              {process.env.NODE_ENV !== "production" ? (
                <div className="mt-5 break-all rounded-2xl border border-line bg-background p-4 font-mono text-xs text-ink-muted">
                  {endpoint}
                </div>
              ) : null}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button className="rounded-2xl" onClick={onRetry} type="button">
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Reintentar
                </Button>
                <Button asChild className="rounded-2xl" variant="outline">
                  <Link href="/biblioteca">Ir a la biblioteca</Link>
                </Button>
              </div>
              <p className="mt-6 text-xs leading-5 text-ink-subtle">
                Estamos ajustando el contenido publico para mostrar una experiencia clara y segura.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export function PublicLandingLoader() {
  const [result, setResult] = useState<PublicViewLoadResult | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;

    loadConfiguredPublicLanding()
      .then((nextResult) => {
        if (active) setResult(nextResult);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setResult({
          ok: false,
          endpoint: "public-view-client",
          message: error instanceof Error ? error.message : "No se pudo cargar la pagina principal.",
          details: error,
        });
      });

    return () => {
      active = false;
    };
  }, [retry]);

  const handleRetry = () => {
    setResult(null);
    setRetry((value) => value + 1);
  };

  if (!result) return <PublicLandingLoading />;

  if (!result.ok) {
    return (
      <PublicViewError
        endpoint={result.endpoint}
        message={result.message}
        onRetry={handleRetry}
        status={result.status}
      />
    );
  }

  return <PublicLandingPage landing={result.landing} />;
}

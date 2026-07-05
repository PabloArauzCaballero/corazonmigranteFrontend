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
    <main className="grid min-h-screen place-items-center bg-[#fbf8f3] px-4 text-[#172b27]">
      <div className="flex items-center gap-3 rounded-2xl border border-[#e3d8cb] bg-white/86 px-5 py-4 text-sm font-semibold shadow-[0_20px_60px_rgba(23,43,39,0.08)]">
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
        Cargando pagina principal...
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
    <main className="min-h-screen bg-[#fbf8f3] px-4 py-10 text-[#172b27]">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-4xl place-items-center">
        <div className="w-full rounded-[2.25rem] border border-amber-200 bg-white/86 p-8 shadow-[0_30px_90px_rgba(23,43,39,0.10)] backdrop-blur md:p-10">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-700">
                Pagina no disponible
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
                No se pudo cargar la pagina principal.
              </h1>
              <p className="mt-5 text-base leading-7 text-[#625e57]">
                {message || "La configuracion publica no esta disponible en este momento."}
              </p>
              {process.env.NODE_ENV !== "production" && status ? (
                <p className="mt-3 text-sm font-semibold text-[#625e57]">
                  HTTP {status}
                </p>
              ) : null}
              {process.env.NODE_ENV !== "production" ? (
                <div className="mt-5 break-all rounded-2xl border border-[#e3d8cb] bg-[#fbf8f3] p-4 font-mono text-xs text-[#625e57]">
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
              <p className="mt-6 text-xs leading-5 text-[#8a8176]">
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

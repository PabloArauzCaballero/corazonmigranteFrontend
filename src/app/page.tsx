"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { loadConfiguredPublicLanding } from "@/features/public-view/public-view.api";
import { PublicLandingPage } from "@/features/public-view/public-landing-page";
import type { PublicViewLoadResult } from "@/features/public-view/public-view.types";
import { Button } from "@/shared/ui/button";

function PublicViewLoading() {
  return (
    <main className="min-h-screen bg-[#fbf8f3] px-4 py-10 text-[#172b27]">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-4xl place-items-center">
        <div className="w-full rounded-[2.25rem] border border-[#e3d8cb] bg-white/86 p-8 text-center shadow-[0_30px_90px_rgba(23,43,39,0.10)] backdrop-blur md:p-10">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          <h1 className="mt-5 text-2xl font-black tracking-tight md:text-4xl">Cargando página principal</h1>
          <p className="mt-3 text-sm leading-6 text-[#625e57]">Estamos preparando la experiencia pública de Corazón Migrante.</p>
        </div>
      </section>
    </main>
  );
}


function publicFriendlyMessage(message: string) {
  if (/NEXT_PUBLIC|endpoint|fetch failed|ECONN|stack|backend|servidor|service unavailable|network/i.test(message)) {
    return "La página no está disponible en este momento. Intenta nuevamente en unos segundos.";
  }

  return message;
}

function PublicViewError({
  message,
  endpoint,
  status,
  onRetry
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
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-700">Página no disponible</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">No se pudo cargar la página principal.</h1>
              <p className="mt-5 text-base leading-7 text-[#625e57]">{publicFriendlyMessage(message)}</p>
              {process.env.NODE_ENV !== "production" && status ? <p className="mt-3 text-sm font-semibold text-[#625e57]">HTTP {status}</p> : null}
              {process.env.NODE_ENV !== "production" ? (
                <div className="mt-5 break-all rounded-2xl border border-[#e3d8cb] bg-[#fbf8f3] p-4 font-mono text-xs text-[#625e57]">{endpoint}</div>
              ) : null}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button className="rounded-2xl" onClick={onRetry} type="button">
                  <RefreshCw className="h-4 w-4" aria-hidden="true" /> Reintentar
                </Button>
                <Button asChild className="rounded-2xl" variant="outline">
                  <Link href="/biblioteca">Ir a la biblioteca</Link>
                </Button>
              </div>
              <p className="mt-6 text-xs leading-5 text-[#8a8176]">Estamos ajustando el contenido público para mostrar una experiencia clara y segura.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function HomePage() {
  const [result, setResult] = useState<PublicViewLoadResult | null>(null);

  const loadLanding = useCallback(() => {
    setResult(null);

    void loadConfiguredPublicLanding()
      .then(setResult)
      .catch((error) => {
        setResult({
          ok: false,
          endpoint: "cliente",
          message: error instanceof Error ? error.message : "No se pudo cargar la página principal.",
          details: error
        });
      });
  }, []);

  useEffect(() => {
    let isMounted = true;

    void loadConfiguredPublicLanding()
      .then((response) => {
        if (isMounted) {
          setResult(response);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setResult({
            ok: false,
            endpoint: "cliente",
            message: error instanceof Error ? error.message : "No se pudo cargar la página principal.",
            details: error
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (!result) return <PublicViewLoading />;

  if (!result.ok) {
    return <PublicViewError message={result.message} endpoint={result.endpoint} status={result.status} onRetry={loadLanding} />;
  }

  return <PublicLandingPage landing={result.landing} />;
}
import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { loadConfiguredPublicLanding } from "@/features/public-view/public-view.api";
import { PublicLandingPage } from "@/features/public-view/public-landing-page";
import { Button } from "@/shared/ui/button";

export const dynamic = "force-dynamic";

function PublicViewError({ message, endpoint, status }: { message: string; endpoint: string; status?: number }) {
  return (
    <main className="min-h-screen bg-[#fbf8f3] px-4 py-10 text-[#172b27]">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-4xl place-items-center">
        <div className="w-full rounded-[2.25rem] border border-amber-200 bg-white/86 p-8 shadow-[0_30px_90px_rgba(23,43,39,0.10)] backdrop-blur md:p-10">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-700">Vista pública no disponible</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">No se pudo cargar la landing configurable desde el backend.</h1>
              <p className="mt-5 text-base leading-7 text-[#625e57]">{message}</p>
              {status ? <p className="mt-3 text-sm font-semibold text-[#625e57]">HTTP {status}</p> : null}
              <div className="mt-5 rounded-2xl border border-[#e3d8cb] bg-[#fbf8f3] p-4 font-mono text-xs text-[#625e57] break-all">{endpoint}</div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild className="rounded-2xl">
                  <Link href="/">
                    <RefreshCw className="h-4 w-4" aria-hidden="true" /> Reintentar
                  </Link>
                </Button>
                <Button asChild className="rounded-2xl" variant="outline">
                  <Link href="/admin/vistas-publicas">Ir a Vistas públicas</Link>
                </Button>
              </div>
              <p className="mt-6 text-xs leading-5 text-[#8a8176]">Esta pantalla no usa contenido de relleno. La home solo se renderiza cuando el backend devuelve la vista pública configurada.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default async function HomePage() {
  const result = await loadConfiguredPublicLanding();

  if (!result.ok) {
    return <PublicViewError message={result.message} endpoint={result.endpoint} status={result.status} />;
  }

  return <PublicLandingPage landing={result.landing} />;
}

import { fileServer } from "@/config/file-server";

export function AuthVisualLayout({ children, eyebrow = "Corazón Migrante", title = "Acompañamiento emocional seguro" }: { children: React.ReactNode; eyebrow?: string; title?: string }) {
  return (
    <section className="container grid min-h-[calc(100vh-5rem)] items-center gap-8 py-12 lg:grid-cols-[0.92fr_1.08fr]">
      <div className="order-2 lg:order-1">{children}</div>
      <aside className="order-1 overflow-hidden border border-slate-200 bg-slate-100 lg:order-2">
        <div className="relative min-h-[22rem] lg:min-h-[38rem]">
          {fileServer.authImageUrl ? <img src={fileServer.authImageUrl} alt="Corazón Migrante" className="absolute inset-0 h-full w-full object-cover" /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/72 via-slate-950/20 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 p-7 text-white md:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/75">{eyebrow}</p>
            <h1 className="mt-3 max-w-md font-serif text-4xl font-bold leading-tight md:text-5xl">{title}</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/80">Imagen configurada desde servidor de archivos por variables `NEXT_PUBLIC_FILE_SERVER_*`, con fallback compatible con el frontend anterior.</p>
          </div>
        </div>
      </aside>
    </section>
  );
}

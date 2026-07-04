import { HeartHandshake } from "lucide-react";
import { fileServer } from "@/config/file-server";

export function AuthVisualLayout({ children, eyebrow = "Corazón Migrante", title = "Acompañamiento emocional seguro" }: { children: React.ReactNode; eyebrow?: string; title?: string }) {
  return (
    <section className="container grid min-h-[calc(100vh-4.75rem)] items-center gap-10 py-10 lg:grid-cols-[0.88fr_1.12fr] lg:py-16">
      <div>{children}</div>
      <aside className="relative hidden overflow-hidden rounded-[2.35rem] border border-white/80 bg-white/70 p-2 shadow-[0_28px_80px_rgba(23,43,39,0.13)] lg:block">
        <div className="relative min-h-[38rem] overflow-hidden rounded-[1.9rem] bg-[#ded8cf]">
          {fileServer.authImageUrl ? <img src={fileServer.authImageUrl} alt="Corazón Migrante" className="absolute inset-0 h-full w-full object-cover" /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#102f2a]/82 via-[#102f2a]/22 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 p-10 text-white">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-white/16 backdrop-blur">
              <HeartHandshake className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.24em] text-white/72">{eyebrow}</p>
            <h1 className="mt-3 max-w-xl text-4xl font-black leading-tight tracking-[-0.04em] md:text-5xl">{title}</h1>
          </div>
        </div>
      </aside>
    </section>
  );
}

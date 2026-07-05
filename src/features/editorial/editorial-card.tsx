import Link from "next/link";
import { ArrowUpRight, Clock3, LockKeyhole } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EditorialResource } from "@/features/editorial/editorial.types";

export function EditorialArticleCard({ resource, priority = false }: { resource: EditorialResource; priority?: boolean }) {
  return (
    <article
      className={cn(
        "group grid overflow-hidden border border-slate-200 bg-white transition duration-300 hover:border-slate-300 hover:bg-slate-50/40",
        priority ? "lg:col-span-2 lg:grid-cols-[1.05fr_0.95fr]" : ""
      )}
    >
      <div className={cn("relative min-h-64 overflow-hidden bg-slate-100", priority ? "lg:min-h-full" : "aspect-[4/3]")}> 
        {resource.imageUrl ? (
          <img
            src={resource.imageUrl}
            alt={resource.imageAlt}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
            loading={priority ? "eager" : "lazy"}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" aria-hidden="true" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="border border-white/40 bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-800 backdrop-blur">{resource.category}</span>
          {resource.isPremium ? <span className="inline-flex items-center gap-1 bg-teal-900 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white"><LockKeyhole className="h-3 w-3" />Premium</span> : null}
        </div>
      </div>
      <div className={cn("flex flex-col justify-between gap-8 p-6 md:p-8", priority ? "lg:min-h-[27rem]" : "")}> 
        <div className="space-y-5">
          <div className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.22em] text-teal-800">
            <span>{resource.eyebrow}</span>
            <span className="h-px w-8 bg-teal-800/50" aria-hidden="true" />
          </div>
          <div className="space-y-3">
            <h2 className={cn("font-serif text-2xl font-bold leading-tight tracking-tight text-slate-950", priority ? "md:text-5xl" : "md:text-3xl")}>{resource.title}</h2>
            {resource.summary ? <p className="text-sm leading-7 text-slate-600 md:text-base">{resource.summary}</p> : null}
          </div>
        </div>
        <div className="space-y-5 border-t border-slate-200 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>{resource.authorLabel}</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
              {resource.readTimeLabel}
            </span>
          </div>
          <Link href={`/biblioteca/recurso?slug=${encodeURIComponent(resource.slug)}`} className="inline-flex items-center gap-2 text-sm font-bold text-teal-800 underline-offset-4 hover:underline">            Leer recurso <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

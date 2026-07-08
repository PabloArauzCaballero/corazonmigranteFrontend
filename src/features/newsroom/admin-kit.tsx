import type { ComponentProps, ReactNode, SelectHTMLAttributes } from "react";
import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

export function Panel({ title, description, children, icon }: { title: string; description?: string; children: ReactNode; icon?: ReactNode }) {
  return <Card className="overflow-hidden rounded-xl border-slate-200 bg-white shadow-none transition-shadow hover:shadow-sm"><CardHeader className="border-b bg-[#f7f4ef]/70"><div className="flex items-start gap-3">{icon ? <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-900 text-white">{icon}</span> : null}<div><CardTitle>{title}</CardTitle>{description ? <CardDescription>{description}</CardDescription> : null}</div></div></CardHeader><CardContent className="p-6">{children}</CardContent></Card>;
}
export function Field({ label, children, hint, className }: { label: string; children: ReactNode; hint?: string; className?: string }) { return <div className={cn("space-y-2", className)}><Label>{label}</Label>{children}{hint ? <p className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}</div>; }
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) { return <select className={cn("focus-ring h-14 w-full rounded-[14px] border border-slate-500/80 bg-[#fbfaf8] px-4 py-3 text-sm shadow-sm hover:border-slate-700 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />; }
export function NativeInput({ className, ...props }: ComponentProps<typeof Input>) { return <Input className={cn("rounded-[14px]", className)} {...props} />; }
export function NativeTextarea({ className, ...props }: ComponentProps<typeof Textarea>) { return <Textarea className={cn("rounded-[14px]", className)} {...props} />; }
export function Submit({ pending, label = "Guardar" }: { pending: boolean; label?: string }) { return <Button type="submit" disabled={pending} className="w-full rounded-xl bg-teal-900 hover:bg-teal-950 sm:w-auto">{pending ? "Procesando..." : label}</Button>; }
export function StatusBadge({ status }: { status?: string | boolean | null }) { const v = typeof status === "boolean" ? (status ? "ACTIVE" : "INACTIVE") : String(status ?? "ACTIVE").toUpperCase(); if (["PUBLISHED", "ACTIVE", "APPROVED"].includes(v)) return <Badge variant="success">{v}</Badge>; if (["DRAFT", "SCHEDULED", "IN_REVIEW"].includes(v)) return <Badge variant="warning">{v}</Badge>; if (["ARCHIVED", "PAUSED", "INACTIVE", "ENDED"].includes(v)) return <Badge variant="muted">{v}</Badge>; if (["BLOCKED", "REJECTED", "CANCELLED"].includes(v)) return <Badge variant="danger">{v}</Badge>; return <Badge variant="secondary">{v}</Badge>; }
export function Notice({ message, error }: { message?: string; error?: string }) { if (!message && !error) return null; return <div className={cn("flex items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors", error ? "border-red-200 bg-red-50 text-red-900" : "border-teal-900/20 bg-teal-900/5 text-teal-950")}>{error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}<p>{error ?? message}</p></div>; }
export type TagOption = { id: string; name: string };

export function TagPicker({ options, value, onChange, loading, placeholder = "Buscar tag..." }: { options: TagOption[]; value: string[]; onChange: (next: string[]) => void; loading?: boolean; placeholder?: string }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => options.filter((option) => value.includes(option.id)), [options, value]);
  const suggestions = useMemo(() => {
    const term = query.trim().toLowerCase();
    return options.filter((option) => !value.includes(option.id) && (!term || option.name.toLowerCase().includes(term))).slice(0, 12);
  }, [options, value, query]);

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2 rounded-xl border bg-background p-2 transition-colors">
        {selected.length === 0 ? <span className="px-1.5 py-1 text-xs text-muted-foreground">Sin tags seleccionados</span> : null}
        {selected.map((tag) => (
          <span key={tag.id} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-colors">
            {tag.name}
            <button type="button" onClick={() => onChange(value.filter((id) => id !== tag.id))} aria-label={`Quitar ${tag.name}`} className="rounded-full transition-colors hover:text-destructive">
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={query}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={loading ? "Cargando tags..." : placeholder}
        disabled={loading}
        className="rounded-xl"
      />
      {open && suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2 rounded-xl border bg-card p-2">
          {suggestions.map((option) => (
            <button
              key={option.id}
              type="button"
              className="rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
              onClick={() => {
                onChange([...value, option.id]);
                setQuery("");
                setOpen(false);
              }}
            >
              {option.name}
            </button>
          ))}
        </div>
      ) : open && !loading && options.length === 0 ? (
        <p className="rounded-[14px] border border-dashed bg-[#fbfaf8] px-4 py-3 text-xs text-muted-foreground">No hay tags cargados todavía. Crea tags en el módulo Tags o revisa permisos de contenido.</p>
      ) : null}
    </div>
  );
}

/** Pagina en el cliente listas que el backend devuelve completas (sin params page/limit soportados). */
export function paginateClient<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return { rows: items.slice(start, start + pageSize), page: safePage, totalPages };
}

export function fstr(form: FormData, key: string) { const v = form.get(key); return typeof v === "string" ? v.trim() : ""; }
export function fnum(form: FormData, key: string, fallback?: number) { const v = Number(fstr(form, key)); return Number.isFinite(v) ? v : fallback; }
export function isoLocal(value: string) { return value ? new Date(value).toISOString() : undefined; }
export function csv(value: string) { return value.split(",").map((x) => x.trim()).filter(Boolean); }
export function fmtDate(value?: string | null) { if (!value) return "—"; const d = new Date(value); if (Number.isNaN(d.getTime())) return value; return new Intl.DateTimeFormat("es-BO", { dateStyle: "medium", timeStyle: "short" }).format(d); }
export function typeLabel(v?: string) { return ({ NEWS: "Noticia", COLUMN: "Columna", OPINION: "Opinión", INTERVIEW: "Entrevista", REPORT: "Reporte", ANALYSIS: "Análisis" } as Record<string,string>)[String(v ?? "NEWS").toUpperCase()] ?? v ?? "Noticia"; }

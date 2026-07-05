import type { ComponentProps, ReactNode, SelectHTMLAttributes } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";

export function Panel({ title, description, children, icon }: { title: string; description?: string; children: ReactNode; icon?: ReactNode }) {
  return <Card className="overflow-hidden border-slate-200 bg-white shadow-none"><CardHeader className="border-b bg-[#f7f4ef]/70"><div className="flex items-start gap-3">{icon ? <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-teal-900 text-white">{icon}</span> : null}<div><CardTitle>{title}</CardTitle>{description ? <CardDescription>{description}</CardDescription> : null}</div></div></CardHeader><CardContent className="p-6">{children}</CardContent></Card>;
}
export function Field({ label, children, hint, className }: { label: string; children: ReactNode; hint?: string; className?: string }) { return <div className={cn("space-y-2", className)}><Label>{label}</Label>{children}{hint ? <p className="text-xs leading-5 text-muted-foreground">{hint}</p> : null}</div>; }
export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) { return <select className={cn("focus-ring flex h-11 w-full rounded-xl border bg-background px-3 py-2 text-sm shadow-sm disabled:opacity-50", className)} {...props} />; }
export function NativeInput(props: ComponentProps<typeof Input>) { return <Input {...props} />; }
export function NativeTextarea(props: ComponentProps<typeof Textarea>) { return <Textarea {...props} />; }
export function Submit({ pending, label = "Guardar" }: { pending: boolean; label?: string }) { return <Button type="submit" disabled={pending} className="w-full bg-teal-900 hover:bg-teal-950 sm:w-auto">{pending ? "Procesando..." : label}</Button>; }
export function StatusBadge({ status }: { status?: string | boolean | null }) { const v = typeof status === "boolean" ? (status ? "ACTIVE" : "INACTIVE") : String(status ?? "ACTIVE").toUpperCase(); if (["PUBLISHED", "ACTIVE", "APPROVED"].includes(v)) return <Badge variant="success">{v}</Badge>; if (["DRAFT", "SCHEDULED", "IN_REVIEW"].includes(v)) return <Badge variant="warning">{v}</Badge>; if (["ARCHIVED", "PAUSED", "INACTIVE", "ENDED"].includes(v)) return <Badge variant="muted">{v}</Badge>; if (["BLOCKED", "REJECTED", "CANCELLED"].includes(v)) return <Badge variant="danger">{v}</Badge>; return <Badge variant="secondary">{v}</Badge>; }
export function Notice({ message, error }: { message?: string; error?: string }) { if (!message && !error) return null; return <div className={cn("flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm", error ? "border-red-200 bg-red-50 text-red-900" : "border-teal-900/20 bg-teal-900/5 text-teal-950")}>{error ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}<p>{error ?? message}</p></div>; }
export function fstr(form: FormData, key: string) { const v = form.get(key); return typeof v === "string" ? v.trim() : ""; }
export function fnum(form: FormData, key: string, fallback?: number) { const v = Number(fstr(form, key)); return Number.isFinite(v) ? v : fallback; }
export function isoLocal(value: string) { return value ? new Date(value).toISOString() : undefined; }
export function csv(value: string) { return value.split(",").map((x) => x.trim()).filter(Boolean); }
export function fmtDate(value?: string | null) { if (!value) return "—"; const d = new Date(value); if (Number.isNaN(d.getTime())) return value; return new Intl.DateTimeFormat("es-BO", { dateStyle: "medium", timeStyle: "short" }).format(d); }
export function typeLabel(v?: string) { return ({ NEWS: "Noticia", COLUMN: "Columna", OPINION: "Opinión", INTERVIEW: "Entrevista", REPORT: "Reporte", ANALYSIS: "Análisis" } as Record<string,string>)[String(v ?? "NEWS").toUpperCase()] ?? v ?? "Noticia"; }

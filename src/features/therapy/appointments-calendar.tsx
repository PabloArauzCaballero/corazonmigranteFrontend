import { CalendarDays } from "lucide-react";
import { Badge } from "@/shared/ui/badge";

export type CalendarAppointment = {
  id: string;
  date: string;
  title: string;
  subtitle?: string;
  status: "activo" | "inactivo" | "pendiente" | "bloqueado";
};

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function weekDays() {
  const now = new Date();
  const start = new Date(now);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function timeLabel(value: string) {
  const date = parseDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat("es-BO", { hour: "2-digit", minute: "2-digit" }).format(date);
}

export function AppointmentsCalendar({ items, title = "Agenda semanal" }: { items: CalendarAppointment[]; title?: string }) {
  const days = weekDays();
  const grouped = new Map<string, CalendarAppointment[]>();
  for (const item of items) {
    const date = parseDate(item.date);
    if (!date) continue;
    const key = dayKey(date);
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }

  return (
    <section className="overflow-hidden border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-[#f7f4ef] px-5 py-4">
        <CalendarDays className="h-5 w-5 text-teal-800" />
        <h2 className="font-serif text-xl font-bold text-slate-950">{title}</h2>
      </div>
      <div className="grid min-w-full gap-px bg-slate-200 md:grid-cols-7">
        {days.map((date) => {
          const key = dayKey(date);
          const dayItems = grouped.get(key) ?? [];
          return (
            <div key={key} className="min-h-40 bg-white p-3">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{new Intl.DateTimeFormat("es-BO", { weekday: "short" }).format(date)}</p>
              <p className="mt-1 text-lg font-bold text-slate-950">{new Intl.DateTimeFormat("es-BO", { day: "2-digit", month: "short" }).format(date)}</p>
              <div className="mt-4 grid gap-2">
                {dayItems.length === 0 ? <p className="text-xs text-slate-400">Sin sesiones</p> : null}
                {dayItems.map((item) => (
                  <div key={item.id} className="border border-teal-900/20 bg-teal-900/5 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-teal-900">{timeLabel(item.date)}</span>
                      <Badge variant={item.status === "pendiente" ? "warning" : "secondary"}>{item.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-950">{item.title}</p>
                    {item.subtitle ? <p className="mt-1 text-xs leading-5 text-slate-600">{item.subtitle}</p> : null}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

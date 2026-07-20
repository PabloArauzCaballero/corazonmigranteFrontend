import Link from "next/link";
import type { Metadata } from "next";
import { FileSearch } from "lucide-react";
import { Button } from "@/shared/ui/button";

export const metadata: Metadata = {
  title: "Página no encontrada | Corazón Migrante",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#f7f4ef] p-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-teal-100">
        <FileSearch className="h-8 w-8 text-teal-700" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">404</p>
        <h1 className="text-2xl font-bold text-slate-900">Página no encontrada</h1>
        <p className="max-w-md text-sm text-slate-500">
          La página que buscas no existe o fue movida. Verifica la dirección o regresa al
          inicio.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/">Ir al inicio</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/novedades">Ver novedades</Link>
        </Button>
      </div>
    </div>
  );
}

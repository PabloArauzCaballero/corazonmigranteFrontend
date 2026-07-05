"use client";

import { useSearchParams } from "next/navigation";
import { NewsDetailPage } from "@/features/newsroom/news-detail";
import { ErrorState } from "@/shared/ui/state";

export function NewsDetailFromQuery() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug")?.trim();
  const premium = searchParams.get("premium") === "1";
  const kind = searchParams.get("kind") === "columns" ? "columns" : "news";

  if (!slug) {
    return (
      <main className="min-h-screen bg-[#f7f4ef] text-slate-950">
        <section className="container py-10">
          <ErrorState
            title="No se pudo abrir la publicacion"
            description="Falta el identificador de la publicacion solicitada."
          />
        </section>
      </main>
    );
  }

  return <NewsDetailPage slug={slug} premium={premium} kind={kind} />;
}

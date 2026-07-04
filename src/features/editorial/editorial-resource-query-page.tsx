"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EditorialArticlePage } from "@/features/editorial/editorial-article-page";
import { Button } from "@/shared/ui/button";
import { EmptyState, LoadingState } from "@/shared/ui/state";

function BibliotecaRecursoContent() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug")?.trim();

  if (!slug) {
    return (
      <main className="container py-12">
        <Button asChild variant="ghost" className="mb-8">
          <Link href="/biblioteca">
            <ArrowLeft className="h-4 w-4" />
            Volver a biblioteca
          </Link>
        </Button>

        <EmptyState
          title="Recurso no especificado"
          description="No se recibió el identificador del recurso de biblioteca."
        />
      </main>
    );
  }

  return <EditorialArticlePage slug={slug} />;
}

export function EditorialResourceQueryPage() {
  return (
    <Suspense fallback={<main className="container py-12"><LoadingState title="Cargando recurso" /></main>}>
      <BibliotecaRecursoContent />
    </Suspense>
  );
}
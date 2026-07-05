import { Suspense } from "react";
import { NewsDetailFromQuery } from "@/features/newsroom/news-detail-from-query";

export const metadata = {
  title: "Publicacion | Corazon Migrante"
};

export default function PublicacionDetallePage() {
  return (
    <Suspense fallback={null}>
      <NewsDetailFromQuery />
    </Suspense>
  );
}

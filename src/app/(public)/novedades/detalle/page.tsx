import { Suspense } from "react";
import { NewsDetailFromQuery } from "@/features/newsroom/news-detail-from-query";

export const metadata = {
  title: "Lectura | Corazon Migrante"
};

export default function NovedadDetallePage() {
  return (
    <Suspense fallback={null}>
      <NewsDetailFromQuery />
    </Suspense>
  );
}

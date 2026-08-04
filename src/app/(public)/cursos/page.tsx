import type { Metadata } from "next";
import { EditorialPublicPage } from "@/features/editorial/editorial-public-page";

export const metadata: Metadata = {
  title: "Cursos | Corazón Migrante",
  description:
    "Formaciones guiadas para acompañar tu proceso migratorio: duelo, ansiedad, adaptación y vínculos a distancia."
};

/**
 * Ruta propia para los cursos en lugar de `/biblioteca?tab=cursos`.
 *
 * Con `output: "export"` + `trailingSlash: true` el hosting estático redirige
 * `/biblioteca` a `/biblioteca/` y en ese salto se pierde la query string, así que
 * el enlace del navbar acababa cayendo en la pestaña por defecto ("Artículos").
 * Una ruta estática real no depende de la query y además permite marcar "Cursos"
 * como sección activa en el menú. Renderiza la misma página que Biblioteca —con
 * el mismo selector de pestañas— abriendo directamente la de cursos.
 */
export default function CursosPage() {
  return <EditorialPublicPage initialTab="cursos" />;
}
